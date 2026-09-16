package com.launchly.bot.engine.action.handler;

import com.launchly.bot.engine.action.BotActionHandler;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.service.TelegramSendService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotifyContactBotActionHandler implements BotActionHandler {

    private static final String ACTION_NOTIFY_CONTACT = "NOTIFY_CONTACT";
    private static final String ACTION_SEND_MESSAGE_TO_CONTACT = "SEND_MESSAGE_TO_CONTACT";

    private static final String KEY_TARGET_USER_ID = "targetUserId";
    private static final String KEY_TARGET_TELEGRAM_ID = "targetTelegramId";
    private static final String KEY_TEXT = "text";
    private static final String KEY_MESSAGE_TEXT = "messageText";
    private static final String KEY_PHOTO_URL = "photoUrl";

    private static final String VAR_FOUND_USER_TELEGRAM_ID_PATTERN = "{found_user.telegram_id}";
    private static final String VAR_FOUND_USER_TELEGRAM_ID = "found_user.telegram_id";
    private static final String VAR_FOUND_TELEGRAM_ID = "found_telegram_id";
    private static final String VAR_TARGET_TELEGRAM_ID = "target_telegram_id";
    private static final String VAR_PARTNER_TELEGRAM_ID = "partner_telegram_id";

    private static final String VAR_TELEGRAM_ID = "telegram_id";
    private static final String VAR_FIRST_NAME = "first_name";
    private static final String VAR_LAST_NAME = "last_name";
    private static final String VAR_USERNAME = "username";

    private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("\\{++([^\\s{}]+)\\}+");

    private final TelegramSendService telegramSendService;

    @Override
    public Set<String> getSupportedTypes() {
        return Set.of(ACTION_NOTIFY_CONTACT, ACTION_SEND_MESSAGE_TO_CONTACT);
    }

    @Override
    public void execute(String type, Map<String, Object> action, BotUser botUser, Map<String, String> sessionData) {
        Long botId = botUser.getBot().getId();

        String rawTargetId = (String) action.getOrDefault(KEY_TARGET_USER_ID, action.getOrDefault(KEY_TARGET_TELEGRAM_ID, ""));
        String rawText = (String) action.getOrDefault(KEY_TEXT, action.getOrDefault(KEY_MESSAGE_TEXT, ""));
        String rawPhotoUrl = (String) action.getOrDefault(KEY_PHOTO_URL, "");

        Long targetTelegramId = resolveTargetTelegramId(rawTargetId, sessionData, botUser);
        if (targetTelegramId == null) {
            log.warn("Cannot notify contact: target Telegram ID could not be resolved from '{}'", rawTargetId);
            return;
        }

        String resolvedText = resolvePlaceholders(rawText, sessionData, botUser);
        String resolvedPhotoUrl = resolvePlaceholders(rawPhotoUrl, sessionData, botUser);

        try {
            if (resolvedPhotoUrl != null && !resolvedPhotoUrl.trim().isEmpty()) {
                telegramSendService.sendPhoto(botId, targetTelegramId, resolvedPhotoUrl.trim(), resolvedText);
            } else if (resolvedText != null && !resolvedText.trim().isEmpty()) {
                telegramSendService.sendMessage(botId, targetTelegramId, resolvedText);
            }
            log.info("Sent cross-contact notification from bot {} to target user {}", botId, targetTelegramId);
        } catch (Exception e) {
            log.error("Failed to send cross-contact notification to {}: {}", targetTelegramId, e.getMessage(), e);
        }
    }

    private Long resolveTargetTelegramId(String raw, Map<String, String> sessionData, BotUser botUser) {
        if (raw == null || raw.trim().isEmpty() || VAR_FOUND_USER_TELEGRAM_ID_PATTERN.equalsIgnoreCase(raw.trim())) {
            if (sessionData != null) {
                String candidateId = sessionData.get(VAR_FOUND_USER_TELEGRAM_ID);
                if (candidateId == null) candidateId = sessionData.get(VAR_FOUND_TELEGRAM_ID);
                if (candidateId == null) candidateId = sessionData.get(VAR_TARGET_TELEGRAM_ID);
                if (candidateId == null) candidateId = sessionData.get(VAR_PARTNER_TELEGRAM_ID);
                if (candidateId != null && !candidateId.trim().isEmpty()) {
                    try {
                        return Long.parseLong(candidateId.trim());
                    } catch (NumberFormatException ignored) {}
                }
            }
            if (raw == null || raw.trim().isEmpty()) return null;
        }
        String val = raw.trim();
        if (val.startsWith("{") && val.endsWith("}")) {
            String key = val.substring(1, val.length() - 1).trim();
            if (sessionData != null && sessionData.containsKey(key)) {
                val = sessionData.get(key);
            } else if (VAR_TELEGRAM_ID.equalsIgnoreCase(key)) {
                return botUser.getTelegramId();
            }
        }
        try {
            return Long.parseLong(val.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String resolvePlaceholders(String text, Map<String, String> sessionData, BotUser botUser) {
        if (text == null) return "";
        Matcher matcher = PLACEHOLDER_PATTERN.matcher(text);
        StringBuilder sb = new StringBuilder();
        while (matcher.find()) {
            String key = matcher.group(1).trim();
            String replacement = "";
            if (sessionData != null && sessionData.containsKey(key)) {
                replacement = sessionData.get(key);
            } else if (VAR_FIRST_NAME.equalsIgnoreCase(key)) {
                replacement = botUser.getFirstName() != null ? botUser.getFirstName() : "";
            } else if (VAR_LAST_NAME.equalsIgnoreCase(key)) {
                replacement = botUser.getLastName() != null ? botUser.getLastName() : "";
            } else if (VAR_USERNAME.equalsIgnoreCase(key)) {
                replacement = botUser.getUsername() != null ? botUser.getUsername() : "";
            } else if (VAR_TELEGRAM_ID.equalsIgnoreCase(key)) {
                replacement = botUser.getTelegramId() != null ? botUser.getTelegramId().toString() : "";
            }
            matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }
}
