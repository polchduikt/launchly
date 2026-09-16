package com.launchly.bot.service.impl;

import com.launchly.bot.constant.ModerationConstants;
import com.launchly.bot.dto.moderation.BotModerationRuleDto;
import com.launchly.bot.dto.moderation.TestModerationRequest;
import com.launchly.bot.dto.moderation.TestModerationResponse;
import com.launchly.bot.dto.moderation.UpdateBotModerationRuleRequest;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotModerationRule;
import com.launchly.bot.entity.FlowSchema;
import com.launchly.bot.entity.MediaMode;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.entity.ViolationAction;
import com.launchly.bot.repository.BotModerationRuleRepository;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.FlowSchemaRepository;
import com.launchly.bot.service.BotModerationService;
import com.launchly.bot.service.helper.BotModerationHelper;
import com.launchly.common.exception.AppException;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.User;
import org.telegram.telegrambots.meta.api.objects.message.Message;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import com.launchly.common.utils.MessageUtils;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

@Slf4j
@Service
@RequiredArgsConstructor
public class BotModerationServiceImpl implements BotModerationService {

    private final BotModerationRuleRepository ruleRepository;
    private final BotRepository botRepository;
    private final FlowSchemaRepository flowSchemaRepository;
    private final ObjectMapper objectMapper;
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
    @Transactional(readOnly = true)
    public BotModerationRuleDto getModerationSettings(Long botId) {
        BotModerationRule rule = ruleRepository.findByBotIdAndChatId(botId, ModerationConstants.GLOBAL_CHAT_ID)
                .orElseGet(() -> createDefaultRule(botId));
        return toDto(rule);
    }

    @Override
    @Transactional
    public BotModerationRuleDto updateModerationSettings(Long botId, UpdateBotModerationRuleRequest request) {
        Bot bot = botRepository.findById(botId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "bot.error.not_found"));

        String chatId = (request.getChatId() != null && !request.getChatId().isBlank())
                ? request.getChatId()
                : ModerationConstants.GLOBAL_CHAT_ID;

        BotModerationRule rule = ruleRepository.findByBotIdAndChatId(botId, chatId)
                .orElseGet(() -> BotModerationRule.builder().bot(bot).chatId(chatId).build());

        rule.setThreadId(request.getThreadId());
        rule.setEnabled(request.isEnabled());
        rule.setAntiForwardEnabled(request.isAntiForwardEnabled());
        rule.setAntiLinkEnabled(request.isAntiLinkEnabled());
        rule.setAllowedLinks(request.getAllowedLinks());
        rule.setStopWords(request.getStopWords());
        rule.setDefaultProfanityFilter(request.isDefaultProfanityFilter());
        rule.setMediaMode(request.getMediaMode() != null ? request.getMediaMode() : MediaMode.ALL);
        rule.setActionOnViolation(request.getActionOnViolation() != null ? request.getActionOnViolation() : ViolationAction.DELETE_AND_WARN);

        if (request.getWarningTemplate() != null) {
            rule.setWarningTemplate(request.getWarningTemplate());
        }
        if (request.getWarnTtlSeconds() != null && request.getWarnTtlSeconds() > 0) {
            rule.setWarnTtlSeconds(request.getWarnTtlSeconds());
        }

        BotModerationRule saved = ruleRepository.save(rule);
        return toDto(saved);
    }

    @Override
    public boolean processUpdateModeration(Long botId, Update update, TelegramClient client) {
        if (!update.hasMessage() || client == null) {
            return false;
        }

        Message message = update.getMessage();
        Long chatId = message.getChatId();
        if (chatId == null) {
            return false;
        }

        BotModerationRule rule = resolveEffectiveRule(botId, String.valueOf(chatId), message.getMessageThreadId());
        if (rule == null || !rule.isEnabled()) {
            return false;
        }

        List<String> reasons = evaluateViolations(message, rule);
        if (reasons.isEmpty()) {
            return false;
        }

        log.info("Moderation violation detected in botId={} chatId={} userId={} reasons={}",
                botId, chatId, message.getFrom() != null ? message.getFrom().getId() : null, reasons);

        executeSanctions(client, message, rule);
        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public TestModerationResponse testModeration(Long botId, TestModerationRequest request) {
        BotModerationRule rule = ruleRepository.findByBotIdAndChatId(botId, ModerationConstants.GLOBAL_CHAT_ID)
                .orElseGet(() -> createDefaultRule(botId));

        List<String> reasons = new ArrayList<>();
        String matchedStopWord = null;

        if (request.isForwarded() && rule.isAntiForwardEnabled()) {
            reasons.add(resolveReason(ModerationConstants.MSG_KEY_REASON_ANTI_FORWARD, "Anti-Forward"));
        }

        if (rule.getMediaMode() == MediaMode.TEXT_ONLY && request.isHasMedia()) {
            reasons.add(resolveReason(ModerationConstants.MSG_KEY_REASON_TEXT_ONLY, "Media Mode: Text only"));
        } else if (rule.getMediaMode() == MediaMode.MEDIA_ONLY && !request.isHasMedia()) {
            reasons.add(resolveReason(ModerationConstants.MSG_KEY_REASON_MEDIA_ONLY, "Media Mode: Media only"));
        }

        String text = request.getText() != null ? request.getText() : "";

        if (rule.isAntiLinkEnabled()) {
            List<String> links = BotModerationHelper.extractUrls(text);
            List<String> whitelist = BotModerationHelper.parseList(rule.getAllowedLinks());
            for (String link : links) {
                if (!BotModerationHelper.isAllowedLink(link, whitelist)) {
                    reasons.add(resolveReason(ModerationConstants.MSG_KEY_REASON_ANTI_LINK, "Anti-Link: " + link, link));
                    break;
                }
            }
        }

        matchedStopWord = BotModerationHelper.findMatchedStopWord(text, rule.isDefaultProfanityFilter(), rule.getStopWords());
        if (matchedStopWord != null) {
            reasons.add(resolveReason(ModerationConstants.MSG_KEY_REASON_STOP_WORD, "Stop-Words: " + matchedStopWord, matchedStopWord));
        }

        return TestModerationResponse.builder()
                .violated(!reasons.isEmpty())
                .reasons(reasons)
                .matchedStopWord(matchedStopWord)
                .build();
    }

    private String resolveReason(String code, String fallback, Object... args) {
        if (messageUtils == null) {
            return fallback;
        }
        String resolved = messageUtils.getMessageWithDefault(code, fallback, args);
        return (resolved != null && !resolved.isBlank()) ? resolved : fallback;
    }

    private BotModerationRule resolveEffectiveRule(Long botId, String chatId, Integer threadId) {
        if (flowSchemaRepository != null && objectMapper != null) {
            try {
                Optional<FlowSchema> schemaOpt = flowSchemaRepository.findByBotId(botId);
                if (schemaOpt.isPresent()) {
                    FlowSchema schema = schemaOpt.get();

                    FlowNode modNode = null;
                    if (schema.getNodes() != null && !schema.getNodes().isBlank() && !"[]".equals(schema.getNodes().trim())) {
                        modNode = findModerationNode(schema.getNodes());
                    }
                    if (modNode == null) {
                        modNode = findModerationNode(schema.getEffectivePublishedNodes());
                    }

                    if (modNode != null) {
                        Map<String, Object> data = modNode.data() != null ? modNode.data() : Collections.emptyMap();
                        boolean enabled = parseBoolean(data.getOrDefault("isEnabled", data.getOrDefault("enabled", data.getOrDefault("isActive", true))), true);
                        if (!enabled) {
                            log.debug("Moderation node is disabled for bot {}", botId);
                            return null;
                        }
                        return buildRuleFromNodeData(chatId, data);
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to extract MODERATION node rule from flow schema for bot {}: {}", botId, e.getMessage());
            }
        }

        List<BotModerationRule> rules = ruleRepository.findAllByBotIdAndEnabledTrue(botId);
        if (!rules.isEmpty()) {
            BotModerationRule matching = findMatchingRule(rules, chatId, threadId);
            if (matching != null && matching.isEnabled()) {
                return matching;
            }
        }

        return null;
    }

    private FlowNode findModerationNode(String nodesJson) {
        if (nodesJson == null || nodesJson.isBlank() || "[]".equals(nodesJson.trim())) {
            return null;
        }
        try {
            List<FlowNode> nodes = objectMapper.readValue(nodesJson, new TypeReference<List<FlowNode>>() {});
            for (FlowNode node : nodes) {
                if (node.type() == NodeType.MODERATION) {
                    return node;
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse nodes JSON for moderation: {}", e.getMessage());
        }
        return null;
    }

    private boolean parseBoolean(Object value, boolean defaultValue) {
        if (value == null) return defaultValue;
        if (value instanceof Boolean b) return b;
        return Boolean.parseBoolean(value.toString());
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

    private BotModerationRule buildRuleFromNodeData(String chatId, Map<String, Object> data) {
        boolean antiForward = parseBoolean(data.get("antiForwardEnabled"), true);
        boolean antiLink = parseBoolean(data.get("antiLinkEnabled"), false);
        boolean filterProfanity = parseBoolean(data.get("filterProfanity"), true);
        String mediaModeStr = (String) data.getOrDefault("mediaMode", "ALL");
        String actionStr = (String) data.getOrDefault("actionOnViolation", "DELETE_AND_WARN");
        String warningTemplate = (String) data.getOrDefault("warningTemplate", ModerationConstants.DEFAULT_WARNING_TEMPLATE);
        int warnTtl = parseInteger(data.get("warnAutoDeleteSeconds"), ModerationConstants.DEFAULT_WARN_AUTO_DELETE_SECONDS);

        String stopWordsStr = extractJoinedString(data.get("stopWords"));
        String allowedLinksStr = extractJoinedString(data.get("whitelistedDomains"));

        MediaMode mediaMode = parseEnum(mediaModeStr, MediaMode.class, MediaMode.ALL);
        ViolationAction action = parseEnum(actionStr, ViolationAction.class, ViolationAction.DELETE_AND_WARN);

        return BotModerationRule.builder()
                .chatId(chatId)
                .enabled(true)
                .antiForwardEnabled(antiForward)
                .antiLinkEnabled(antiLink)
                .allowedLinks(allowedLinksStr)
                .stopWords(stopWordsStr)
                .defaultProfanityFilter(filterProfanity)
                .mediaMode(mediaMode)
                .actionOnViolation(action)
                .warningTemplate(warningTemplate)
                .warnTtlSeconds(warnTtl)
                .build();
    }

    private String extractJoinedString(Object obj) {
        if (obj instanceof List<?> list) {
            return String.join(", ", list.stream().map(Object::toString).toList());
        } else if (obj instanceof String s) {
            return s;
        }
        return "";
    }

    private <E extends Enum<E>> E parseEnum(String value, Class<E> enumClass, E defaultValue) {
        if (value == null || value.isBlank()) return defaultValue;
        try {
            return Enum.valueOf(enumClass, value.trim().toUpperCase());
        } catch (Exception ignored) {
            return defaultValue;
        }
    }

    private List<String> evaluateViolations(Message message, BotModerationRule rule) {
        List<String> reasons = new ArrayList<>();

        if (rule.isAntiForwardEnabled() && BotModerationHelper.isForwarded(message)) {
            reasons.add(ModerationConstants.CODE_ANTI_FORWARD);
        }

        boolean hasMedia = BotModerationHelper.hasMediaContent(message);
        if (rule.getMediaMode() == MediaMode.TEXT_ONLY && hasMedia) {
            reasons.add(ModerationConstants.CODE_TEXT_ONLY);
        } else if (rule.getMediaMode() == MediaMode.MEDIA_ONLY && !hasMedia) {
            reasons.add(ModerationConstants.CODE_MEDIA_ONLY);
        }

        String text = BotModerationHelper.extractMessageText(message);

        if (rule.isAntiLinkEnabled() && text != null) {
            List<String> links = BotModerationHelper.extractUrls(text);
            List<String> whitelist = BotModerationHelper.parseList(rule.getAllowedLinks());
            for (String link : links) {
                if (!BotModerationHelper.isAllowedLink(link, whitelist)) {
                    reasons.add(ModerationConstants.CODE_ANTI_LINK_PREFIX + link);
                    break;
                }
            }
        }

        if (text != null) {
            String matched = BotModerationHelper.findMatchedStopWord(text, rule.isDefaultProfanityFilter(), rule.getStopWords());
            if (matched != null) {
                reasons.add(ModerationConstants.CODE_STOP_WORD_PREFIX + matched);
            }
        }

        return reasons;
    }

    private void executeSanctions(TelegramClient client, Message message, BotModerationRule rule) {
        Long chatId = message.getChatId();
        Integer messageId = message.getMessageId();
        User from = message.getFrom();
        Long userId = from != null ? from.getId() : null;

        BotModerationHelper.deleteMessageSafe(client, chatId, messageId);

        ViolationAction action = rule.getActionOnViolation();
        if (action == ViolationAction.DELETE_AND_WARN
                || action == ViolationAction.DELETE_AND_MUTE
                || action == ViolationAction.DELETE_AND_KICK) {
            BotModerationHelper.sendSelfDestructWarning(
                    client,
                    scheduledExecutor,
                    chatId,
                    from,
                    rule.getWarningTemplate(),
                    rule.getWarnTtlSeconds(),
                    messageUtils
            );
        }

        if (userId != null) {
            if (action == ViolationAction.DELETE_AND_MUTE) {
                BotModerationHelper.muteUser(client, chatId, userId, ModerationConstants.DEFAULT_MUTE_DURATION_SECONDS);
            } else if (action == ViolationAction.DELETE_AND_KICK) {
                BotModerationHelper.kickUser(client, chatId, userId);
            }
        }
    }

    private BotModerationRule findMatchingRule(List<BotModerationRule> rules, String chatId, Integer threadId) {
        for (BotModerationRule r : rules) {
            if (chatId.equals(r.getChatId())) {
                if (r.getThreadId() != null) {
                    if (r.getThreadId().equals(threadId)) {
                        return r;
                    }
                } else {
                    return r;
                }
            }
        }
        for (BotModerationRule r : rules) {
            if (ModerationConstants.GLOBAL_CHAT_ID.equals(r.getChatId())) {
                return r;
            }
        }
        return null;
    }

    private BotModerationRule createDefaultRule(Long botId) {
        Bot bot = botRepository.findById(botId).orElse(null);
        return BotModerationRule.builder()
                .bot(bot)
                .chatId(ModerationConstants.GLOBAL_CHAT_ID)
                .enabled(false)
                .antiForwardEnabled(false)
                .antiLinkEnabled(false)
                .defaultProfanityFilter(true)
                .mediaMode(MediaMode.ALL)
                .actionOnViolation(ViolationAction.DELETE_AND_WARN)
                .warnTtlSeconds(ModerationConstants.DEFAULT_WARN_TTL_SECONDS)
                .warningTemplate(ModerationConstants.DEFAULT_WARNING_TEMPLATE)
                .build();
    }

    private BotModerationRuleDto toDto(BotModerationRule rule) {
        return BotModerationRuleDto.builder()
                .id(rule.getId())
                .botId(rule.getBot() != null ? rule.getBot().getId() : null)
                .chatId(rule.getChatId())
                .threadId(rule.getThreadId())
                .enabled(rule.isEnabled())
                .antiForwardEnabled(rule.isAntiForwardEnabled())
                .antiLinkEnabled(rule.isAntiLinkEnabled())
                .allowedLinks(rule.getAllowedLinks())
                .stopWords(rule.getStopWords())
                .defaultProfanityFilter(rule.isDefaultProfanityFilter())
                .mediaMode(rule.getMediaMode())
                .actionOnViolation(rule.getActionOnViolation())
                .warningTemplate(rule.getWarningTemplate())
                .warnTtlSeconds(rule.getWarnTtlSeconds())
                .build();
    }
}
