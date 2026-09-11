package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.action.ActionContactManager;
import com.launchly.bot.engine.action.ActionPlaceholderResolver;
import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.service.BotDialogStateService;
import com.launchly.common.utils.MessageUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import tools.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class CooldownNodeExecutor implements NodeExecutor {

    private final BotDialogStateService stateService;
    private final ActionContactManager contactManager;
    private final ActionPlaceholderResolver placeholderResolver;
    private final MessageUtils messageUtils;
    private final ObjectMapper objectMapper;

    @Override
    public NodeType getType() {
        return NodeType.COOLDOWN;
    }

    @Override
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                          Update update, TelegramClient client) {
        Long botId = botUser.getBot().getId();
        Long telegramUserId = botUser.getTelegramId();
        String chatId = resolveChatId(update, botUser);
        String chatScope = resolveChatScope(update);
        Map<String, Object> data = node.data();

        long duration = 1;
        String unit = "MINUTES";
        String blockMessage = messageUtils.getMessage("bot.cooldown.default_message");
        String cooldownKey = "cooldown_" + node.id();

        if (data != null) {
            if (data.get("duration") != null) {
                duration = parsePositiveLong(data.get("duration"), 1);
            }
            if (data.get("unit") instanceof String s && !s.trim().isEmpty()) {
                unit = s.trim().toUpperCase();
            }
            if (data.get("blockMessage") instanceof String s && !s.trim().isEmpty()) {
                blockMessage = s.trim();
            }
            if (data.get("cooldownKey") instanceof String s && !s.trim().isEmpty()) {
                cooldownKey = "cooldown_" + s.trim();
            }
        }

        String scopedCooldownKey = (!"private".equalsIgnoreCase(chatScope) ? chatScope + "_" : "") + cooldownKey;

        long durationMs = switch (unit) {
            case "SECONDS" -> duration * 1000L;
            case "HOURS" -> duration * 3600 * 1000L;
            case "DAYS" -> duration * 86400 * 1000L;
            default -> duration * 60 * 1000L; // MINUTES
        };

        Map<String, String> sessionData = stateService.getSessionData(botId, telegramUserId);
        long lastPassedTime = getLastPassedTimestamp(botUser, scopedCooldownKey, sessionData);
        long now = System.currentTimeMillis();

        if (lastPassedTime > 0) {
            long elapsed = now - lastPassedTime;
            if (elapsed < durationMs) {
                long remainingMs = durationMs - elapsed;
                String remainingFormatted = formatRemainingTime(remainingMs);

                long remSeconds = TimeUnit.MILLISECONDS.toSeconds(remainingMs) % 60;
                long remMinutes = TimeUnit.MILLISECONDS.toMinutes(remainingMs) % 60;
                long remHours = TimeUnit.MILLISECONDS.toHours(remainingMs) % 24;
                long remDays = TimeUnit.MILLISECONDS.toDays(remainingMs);
                long totalSeconds = Math.max(1, TimeUnit.MILLISECONDS.toSeconds(remainingMs));
                long totalMinutes = Math.max(1, TimeUnit.MILLISECONDS.toMinutes(remainingMs));

                String msg = blockMessage
                        .replace("{remaining}", remainingFormatted)
                        .replace("{{remaining}}", remainingFormatted)
                        .replace("{seconds}", String.valueOf(remSeconds > 0 ? remSeconds : totalSeconds))
                        .replace("{{seconds}}", String.valueOf(remSeconds > 0 ? remSeconds : totalSeconds))
                        .replace("{total_seconds}", String.valueOf(totalSeconds))
                        .replace("{{total_seconds}}", String.valueOf(totalSeconds))
                        .replace("{minutes}", String.valueOf(remMinutes > 0 ? remMinutes : totalMinutes))
                        .replace("{{minutes}}", String.valueOf(remMinutes > 0 ? remMinutes : totalMinutes))
                        .replace("{hours}", String.valueOf(remHours))
                        .replace("{{hours}}", String.valueOf(remHours))
                        .replace("{days}", String.valueOf(remDays))
                        .replace("{{days}}", String.valueOf(remDays));

                msg = placeholderResolver.resolveValue(msg, sessionData, botUser);

                try {
                    SendMessage sendMessage = SendMessage.builder()
                            .chatId(chatId)
                            .text(msg)
                            .build();
                    client.execute(sendMessage);
                } catch (TelegramApiException e) {
                    log.error("Failed to send cooldown message to chat {}: {}", chatId, e.getMessage());
                }

                log.info("Cooldown ACTIVE for botUser {} on key '{}' (scope '{}'). Remaining: {}ms",
                        botUser.getId(), scopedCooldownKey, chatScope, remainingMs);

                return null;
            }
        }

        String nowStr = String.valueOf(now);
        stateService.setSessionData(botId, telegramUserId, scopedCooldownKey, nowStr);
        contactManager.updateContactCooldown(botUser, scopedCooldownKey, nowStr);

        log.info("Cooldown PASSED for botUser {} on key '{}' (scope '{}'). Proceeding to next node.",
                botUser.getId(), scopedCooldownKey, chatScope);

        return edges.stream()
                .filter(e -> e.source().equals(node.id()))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);
    }

    private String resolveChatId(Update update, BotUser botUser) {
        if (update != null) {
            if (update.hasMessage() && update.getMessage().getChat() != null) {
                return update.getMessage().getChatId().toString();
            }
            if (update.hasCallbackQuery() && update.getCallbackQuery().getMessage() != null && update.getCallbackQuery().getMessage().getChat() != null) {
                return update.getCallbackQuery().getMessage().getChatId().toString();
            }
            if (update.hasChannelPost() && update.getChannelPost().getChat() != null) {
                return update.getChannelPost().getChatId().toString();
            }
        }
        return botUser != null && botUser.getTelegramId() != null ? botUser.getTelegramId().toString() : "0";
    }

    private String resolveChatScope(Update update) {
        if (update != null) {
            if (update.hasMessage() && update.getMessage().getChat() != null) {
                String type = update.getMessage().getChat().getType();
                if ("private".equalsIgnoreCase(type)) {
                    return "private";
                }
                return update.getMessage().getChatId().toString();
            }
            if (update.hasCallbackQuery() && update.getCallbackQuery().getMessage() != null && update.getCallbackQuery().getMessage().getChat() != null) {
                String type = update.getCallbackQuery().getMessage().getChat().getType();
                if ("private".equalsIgnoreCase(type)) {
                    return "private";
                }
                return update.getCallbackQuery().getMessage().getChatId().toString();
            }
            if (update.hasChannelPost() && update.getChannelPost().getChat() != null) {
                return update.getChannelPost().getChatId().toString();
            }
        }
        return "private";
    }

    private long getLastPassedTimestamp(BotUser botUser, String key, Map<String, String> sessionData) {
        String sessionVal = sessionData.get(key);
        if (sessionVal != null && !sessionVal.trim().isEmpty()) {
            try {
                return Long.parseLong(sessionVal.trim());
            } catch (NumberFormatException ignored) {}
        }

        try {
            if (botUser.getMetadata() != null && !botUser.getMetadata().trim().isEmpty()) {
                Map<String, Object> meta = objectMapper.readValue(botUser.getMetadata(), Map.class);
                Map<String, Object> cooldowns = (Map<String, Object>) meta.get("cooldowns");
                if (cooldowns != null && cooldowns.get(key) != null) {
                    Object valObj = cooldowns.get(key);
                    if (valObj instanceof Number num) {
                        return num.longValue();
                    }
                    return Long.parseLong(valObj.toString().trim());
                }
                Map<String, Object> custom = (Map<String, Object>) meta.get("customFields");
                if (custom != null && custom.get(key) != null) {
                    Object valObj = custom.get(key);
                    if (valObj instanceof Number num) {
                        return num.longValue();
                    }
                    return Long.parseLong(valObj.toString().trim());
                }
            }
        } catch (Exception ignored) {}

        return 0L;
    }

    private String formatRemainingTime(long remainingMs) {
        long seconds = TimeUnit.MILLISECONDS.toSeconds(remainingMs);
        if (seconds <= 0) {
            return messageUtils.getMessage("time.less_than_second");
        }
        long days = TimeUnit.MILLISECONDS.toDays(remainingMs);
        long hours = TimeUnit.MILLISECONDS.toHours(remainingMs) % 24;
        long minutes = TimeUnit.MILLISECONDS.toMinutes(remainingMs) % 60;
        long remSec = seconds % 60;

        if (days > 0) {
            if (hours > 0) {
                return messageUtils.getMessage("time.days_hours", days, hours);
            }
            return messageUtils.getMessage("time.days", days);
        }
        if (hours > 0) {
            if (minutes > 0) {
                return messageUtils.getMessage("time.hours_minutes", hours, minutes);
            }
            return messageUtils.getMessage("time.hours", hours);
        }
        if (minutes > 0) {
            if (remSec > 0) {
                return messageUtils.getMessage("time.minutes_seconds", minutes, remSec);
            }
            return messageUtils.getMessage("time.minutes", minutes);
        }
        return messageUtils.getMessage("time.seconds", seconds);
    }

    private long parsePositiveLong(Object obj, long fallback) {
        if (obj == null) return fallback;
        if (obj instanceof Number num) return Math.max(0, num.longValue());
        try {
            return Math.max(0, Long.parseLong(obj.toString().trim()));
        } catch (NumberFormatException e) {
            return fallback;
        }
    }
}
