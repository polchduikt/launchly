package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.service.BotDialogStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.groupadministration.GetChatMember;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.chatmember.ChatMember;
import org.telegram.telegrambots.meta.api.objects.chatmember.ChatMemberAdministrator;
import org.telegram.telegrambots.meta.api.objects.chatmember.ChatMemberMember;
import org.telegram.telegrambots.meta.api.objects.chatmember.ChatMemberOwner;
import org.telegram.telegrambots.meta.api.objects.chatmember.ChatMemberRestricted;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class SubscriptionCheckNodeExecutor implements NodeExecutor {

    private static final List<String> PASS_HANDLES = List.of("subscribed", "true", "yes");
    private static final List<String> FAIL_HANDLES = List.of("not_subscribed", "false", "no");
    private static final String MODE_ANY = "any";
    private static final String MODE_ALL = "all";
    private static final String KEY_MODE = "mode";
    private static final String KEY_PASS_VAR = "passVariable";
    private static final String KEY_UNSUBS_VAR = "unsubscribedVariable";
    private static final String KEY_CHANNELS = "channels";
    private static final String KEY_CHANNEL_ID = "channelId";
    private static final String KEY_CHANNEL_LEGACY = "channel";
    private static final String KEY_CHANNEL_NAME = "name";
    private static final String KEY_IS_REQUIRED = "isRequired";
    private static final String DEFAULT_PASS_VAR = "is_subscribed";
    private static final String DEFAULT_UNSUBS_VAR = "unsubscribed_channels";
    private static final String VAR_SUBSCRIBED_COUNT = "subscribed_channels_count";
    private static final String VAR_TOTAL_COUNT = "total_channels_count";
    private static final Set<String> SUBSCRIBED_STATUS_STRINGS = Set.of(
            "creator",
            "owner",
            "administrator",
            "member"
    );
    private static final List<String> TELEGRAM_URL_PREFIXES = List.of(
            "https://t.me/",
            "http://t.me/",
            "t.me/"
    );
    private final BotDialogStateService stateService;

    @Override
    public NodeType getType() {
        return NodeType.SUBSCRIPTION_CHECK;
    }

    @Override
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                          Update update, TelegramClient client) {
        Long botId = botUser.getBot().getId();
        Long telegramUserId = botUser.getTelegramId();
        Map<String, Object> data = node.data() != null ? node.data() : Collections.emptyMap();

        String mode = (String) data.getOrDefault(KEY_MODE, MODE_ALL);
        String passVar = (String) data.getOrDefault(KEY_PASS_VAR, DEFAULT_PASS_VAR);
        String unsubsVar = (String) data.getOrDefault(KEY_UNSUBS_VAR, DEFAULT_UNSUBS_VAR);

        List<Map<String, Object>> channels = extractChannels(data);

        int totalRequired = 0;
        int totalSubscribed = 0;
        List<String> unsubscribedChannelsList = new ArrayList<>();

        if (client != null && telegramUserId != null) {
            for (Map<String, Object> ch : channels) {
                String rawChatId = getChannelId(ch);
                if (rawChatId == null || rawChatId.isBlank()) {
                    continue;
                }

                boolean isRequired = ch.get(KEY_IS_REQUIRED) == null || Boolean.TRUE.equals(ch.get(KEY_IS_REQUIRED));
                if (isRequired) {
                    totalRequired++;
                }

                String chatId = normalizeChatId(rawChatId);
                String channelTitle = (String) ch.getOrDefault(KEY_CHANNEL_NAME, chatId);
                if (channelTitle == null || channelTitle.isBlank()) {
                    channelTitle = chatId;
                }

                boolean isMember = checkMembership(client, chatId, telegramUserId);
                if (isMember) {
                    if (isRequired) {
                        totalSubscribed++;
                    }
                } else if (isRequired) {
                    unsubscribedChannelsList.add(channelTitle);
                }
            }
        }

        boolean passed = evaluatePassCondition(mode, totalSubscribed, totalRequired);

        saveSessionResults(botId, telegramUserId, passVar, unsubsVar, passed, totalSubscribed, totalRequired, unsubscribedChannelsList);

        return resolveNextTarget(edges, node.id(), passed);
    }

    private boolean evaluatePassCondition(String mode, int totalSubscribed, int totalRequired) {
        if (totalRequired == 0) {
            return true;
        }
        if (MODE_ANY.equalsIgnoreCase(mode)) {
            return totalSubscribed > 0;
        }
        return totalSubscribed >= totalRequired;
    }

    private boolean checkMembership(TelegramClient client, String chatId, Long telegramUserId) {
        try {
            GetChatMember getChatMember = GetChatMember.builder()
                    .chatId(chatId)
                    .userId(telegramUserId)
                    .build();

            ChatMember chatMember = client.execute(getChatMember);
            if (chatMember == null) {
                return false;
            }

            if (chatMember instanceof ChatMemberOwner
                    || chatMember instanceof ChatMemberAdministrator
                    || chatMember instanceof ChatMemberMember) {
                return true;
            }

            if (chatMember instanceof ChatMemberRestricted restricted) {
                return Boolean.TRUE.equals(restricted.getIsMember());
            }

            String status = chatMember.getStatus();
            if (status != null && SUBSCRIBED_STATUS_STRINGS.contains(status.trim().toLowerCase())) {
                return true;
            }

            return false;
        } catch (Exception e) {
            log.warn("Failed to check chat member {} in {}: {}", telegramUserId, chatId, e.getMessage());
            return false;
        }
    }

    private String resolveNextTarget(List<FlowEdge> edges, String nodeId, boolean passed) {
        List<String> preferredHandles = passed ? PASS_HANDLES : FAIL_HANDLES;

        for (String handle : preferredHandles) {
            String target = findTarget(edges, nodeId, handle);
            if (target != null) {
                return target;
            }
        }

        return edges.stream()
                .filter(e -> e.source().equals(nodeId))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractChannels(Map<String, Object> data) {
        if (data.get(KEY_CHANNELS) instanceof List<?> list) {
            return (List<Map<String, Object>>) list;
        }
        if (data.containsKey(KEY_CHANNEL_ID) || data.containsKey(KEY_CHANNEL_LEGACY)) {
            String chId = (String) data.getOrDefault(KEY_CHANNEL_ID, data.get(KEY_CHANNEL_LEGACY));
            if (chId != null && !chId.isBlank()) {
                return List.of(Map.of(
                        KEY_CHANNEL_ID, chId,
                        KEY_CHANNEL_NAME, data.getOrDefault("channelName", chId),
                        KEY_IS_REQUIRED, true
                ));
            }
        }
        return Collections.emptyList();
    }

    private String getChannelId(Map<String, Object> ch) {
        String id = (String) ch.get(KEY_CHANNEL_ID);
        if (id == null || id.isBlank()) {
            id = (String) ch.get(KEY_CHANNEL_LEGACY);
        }
        return id;
    }

    private String normalizeChatId(String raw) {
        String trimmed = raw.trim();
        for (String prefix : TELEGRAM_URL_PREFIXES) {
            if (trimmed.startsWith(prefix)) {
                trimmed = trimmed.substring(prefix.length());
                break;
            }
        }

        if (trimmed.startsWith("@") || trimmed.startsWith("-") || trimmed.matches("^-?\\d+$") || trimmed.startsWith("+")) {
            return trimmed;
        }
        return "@" + trimmed;
    }

    private void saveSessionResults(Long botId, Long telegramUserId, String passVar, String unsubsVar,
                                    boolean passed, int totalSubscribed, int totalRequired, List<String> unsubscribedList) {
        stateService.setSessionData(botId, telegramUserId, passVar, String.valueOf(passed));
        stateService.setSessionData(botId, telegramUserId, unsubsVar, String.join(", ", unsubscribedList));
        stateService.setSessionData(botId, telegramUserId, VAR_SUBSCRIBED_COUNT, String.valueOf(totalSubscribed));
        stateService.setSessionData(botId, telegramUserId, VAR_TOTAL_COUNT, String.valueOf(totalRequired));
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
