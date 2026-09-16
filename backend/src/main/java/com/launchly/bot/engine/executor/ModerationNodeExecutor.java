package com.launchly.bot.engine.executor;

import com.launchly.bot.constant.ModerationConstants;
import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.service.BotDialogStateService;
import com.launchly.bot.service.helper.BotModerationHelper;
import com.launchly.common.utils.MessageUtils;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.User;
import org.telegram.telegrambots.meta.api.objects.message.Message;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

@Slf4j
@Component
@RequiredArgsConstructor
public class ModerationNodeExecutor implements NodeExecutor {

    private static final List<String> PASS_HANDLES = List.of("clean", "passed", "success", "true", "yes");
    private static final List<String> FAIL_HANDLES = List.of("violated", "blocked", "failed", "false", "no");

    private final BotDialogStateService stateService;
    private final MessageUtils messageUtils;
    private final ScheduledExecutorService scheduledExecutor = Executors.newSingleThreadScheduledExecutor();

    @PreDestroy
    public void cleanup() {
        try {
            scheduledExecutor.shutdown();
        } catch (Exception e) {
            log.debug("Error shutting down moderation executor: {}", e.getMessage());
        }
    }

    @Override
    public NodeType getType() {
        return NodeType.MODERATION;
    }

    @Override
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser, Update update, TelegramClient client) {
        Long botId = botUser.getBot().getId();
        Long telegramUserId = botUser.getTelegramId();
        Map<String, Object> data = node.data() != null ? node.data() : Collections.emptyMap();

        boolean antiForward = Boolean.TRUE.equals(data.get("antiForwardEnabled"));
        boolean antiLink = Boolean.TRUE.equals(data.get("antiLinkEnabled"));
        String allowedLinks = extractJoinedString(data.get("whitelistedDomains"), (String) data.getOrDefault("allowedLinks", ""));
        String stopWords = extractJoinedString(data.get("stopWords"), "");
        boolean defaultProfanity = data.get("defaultProfanityFilter") == null || Boolean.TRUE.equals(data.get("defaultProfanityFilter")) || Boolean.TRUE.equals(data.get("filterProfanity"));
        String mediaModeStr = (String) data.getOrDefault("mediaMode", "ALL");
        String sanctionStr = (String) data.getOrDefault("actionOnViolation", "DELETE_AND_WARN");
        String warningTemplate = (String) data.getOrDefault("warningTemplate", ModerationConstants.DEFAULT_WARNING_TEMPLATE);
        int warnTtl = parseInteger(data.get("warnAutoDeleteSeconds"), parseInteger(data.get("warnTtlSeconds"), ModerationConstants.DEFAULT_WARN_AUTO_DELETE_SECONDS));
        int muteDurationMinutes = parseInteger(data.get("muteDurationMinutes"), ModerationConstants.DEFAULT_MUTE_DURATION_MINUTES);

        String passVar = (String) data.getOrDefault("passVariable", ModerationConstants.DEFAULT_PASS_VARIABLE);
        String reasonVar = (String) data.getOrDefault("violationReasonVariable", ModerationConstants.DEFAULT_REASON_VARIABLE);

        List<String> reasons = new ArrayList<>();

        if (update != null && update.hasMessage()) {
            Message message = update.getMessage();

            if (antiForward && BotModerationHelper.isForwarded(message)) {
                reasons.add(ModerationConstants.CODE_ANTI_FORWARD);
            }

            boolean hasMedia = BotModerationHelper.hasMediaContent(message);
            if ("TEXT_ONLY".equalsIgnoreCase(mediaModeStr) && hasMedia) {
                reasons.add(ModerationConstants.CODE_TEXT_ONLY);
            } else if ("MEDIA_ONLY".equalsIgnoreCase(mediaModeStr) && !hasMedia) {
                reasons.add(ModerationConstants.CODE_MEDIA_ONLY);
            }

            String text = BotModerationHelper.extractMessageText(message);
            if (antiLink && text != null) {
                List<String> links = BotModerationHelper.extractUrls(text);
                List<String> whitelist = BotModerationHelper.parseList(allowedLinks);
                for (String link : links) {
                    if (!BotModerationHelper.isAllowedLink(link, whitelist)) {
                        reasons.add(ModerationConstants.CODE_ANTI_LINK_PREFIX + link);
                        break;
                    }
                }
            }

            if (text != null) {
                String matched = BotModerationHelper.findMatchedStopWord(text, defaultProfanity, stopWords);
                if (matched != null) {
                    reasons.add(ModerationConstants.CODE_STOP_WORD_PREFIX + matched);
                }
            }

            if (!reasons.isEmpty() && client != null && !"NONE".equalsIgnoreCase(sanctionStr)) {
                executeSanction(client, message, sanctionStr, warningTemplate, warnTtl, muteDurationMinutes);
            }
        }

        boolean passed = reasons.isEmpty();

        stateService.setSessionData(botId, telegramUserId, passVar, String.valueOf(passed));
        stateService.setSessionData(botId, telegramUserId, reasonVar, String.join(", ", reasons));

        return resolveNextTarget(edges, node.id(), passed);
    }

    private void executeSanction(TelegramClient client,
                                Message message,
                                String sanction,
                                String warningTemplate,
                                int warnTtl,
                                int muteDurationMinutes) {
        Long chatId = message.getChatId();
        Integer messageId = message.getMessageId();
        User from = message.getFrom();
        Long userId = from != null ? from.getId() : null;

        BotModerationHelper.deleteMessageSafe(client, chatId, messageId);

        if ("DELETE_AND_WARN".equalsIgnoreCase(sanction)
                || "DELETE_AND_MUTE".equalsIgnoreCase(sanction)
                || "DELETE_AND_KICK".equalsIgnoreCase(sanction)) {
            BotModerationHelper.sendSelfDestructWarning(client, scheduledExecutor, chatId, from, warningTemplate, warnTtl, messageUtils);
        }

        if (userId != null) {
            if ("DELETE_AND_MUTE".equalsIgnoreCase(sanction)) {
                int durationSeconds = muteDurationMinutes > 0
                        ? muteDurationMinutes * ModerationConstants.SECONDS_PER_MINUTE
                        : ModerationConstants.DEFAULT_MUTE_DURATION_SECONDS;
                BotModerationHelper.muteUser(client, chatId, userId, durationSeconds);
            } else if ("DELETE_AND_KICK".equalsIgnoreCase(sanction)) {
                BotModerationHelper.kickUser(client, chatId, userId);
            }
        }
    }

    private String extractJoinedString(Object obj, String fallback) {
        if (obj instanceof List<?> list) {
            return String.join(", ", list.stream().map(Object::toString).toList());
        } else if (obj instanceof String s && !s.isBlank()) {
            return s;
        }
        return fallback;
    }

    private int parseInteger(Object value, int defaultValue) {
        if (value == null) return defaultValue;
        if (value instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(value.toString());
        } catch (Exception e) {
            return defaultValue;
        }
    }

    private String resolveNextTarget(List<FlowEdge> edges, String nodeId, boolean passed) {
        List<String> preferredHandles = passed ? PASS_HANDLES : FAIL_HANDLES;

        for (String handle : preferredHandles) {
            String target = findTarget(edges, nodeId, handle);
            if (target != null) return target;
        }

        return edges.stream()
                .filter(e -> e.source().equals(nodeId))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);
    }

    private String findTarget(List<FlowEdge> edges, String nodeId, String handleId) {
        return edges.stream()
                .filter(e -> e.source().equals(nodeId))
                .filter(e -> handleId.equals(e.sourceHandle()))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);
    }
}