package com.launchly.bot.engine.action;

import com.launchly.bot.entity.BotUser;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.service.BotDialogStateService;
import com.launchly.common.utils.SanitizationUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ActionContactManager {

    private static final int MAX_FIELD_NAME_LENGTH = 50;
    private static final int MAX_CUSTOM_FIELDS_COUNT = 100;
    private static final int MAX_CUSTOM_FIELD_VALUE_LENGTH = 2000;

    private static final String DEFAULT_CHAT_SCOPE = "private";
    private static final String KEYWORD_COOLDOWN = "cooldown";

    private static final String KEY_COOLDOWNS = "cooldowns";
    private static final String KEY_CUSTOM_FIELDS = "customFields";
    private static final String KEY_CHAT_CUSTOM_FIELDS = "chatCustomFields";

    private static final String FIELD_FIRST_NAME = "first_name";
    private static final String FIELD_FIRST_NAME_LABEL = "First Name";
    private static final String FIELD_LAST_NAME = "last_name";
    private static final String FIELD_LAST_NAME_LABEL = "Last Name";
    private static final String FIELD_USERNAME = "username";
    private static final String FIELD_TELEGRAM_USERNAME = "telegram_username";
    private static final String FIELD_TELEGRAM_USERNAME_LABEL = "Telegram Username";
    private static final String FIELD_PHONE = "phone";
    private static final String FIELD_PHONE_LABEL = "Phone";
    private static final String FIELD_EMAIL = "email";
    private static final String FIELD_EMAIL_LABEL = "Email";

    private final BotUserRepository botUserRepository;
    private final BotDialogStateService stateService;
    private final ObjectMapper objectMapper;

    @SuppressWarnings("unchecked")
    public void updateContactCooldown(BotUser botUser, String cooldownKey, String timestampStr) {
        try {
            Map<String, Object> metaMap = new HashMap<>();
            if (botUser.getMetadata() != null && !botUser.getMetadata().trim().isEmpty()) {
                try {
                    metaMap = objectMapper.readValue(botUser.getMetadata(), Map.class);
                } catch (Exception e) {
                    log.error("Failed to parse metadata: {}", e.getMessage());
                }
            }

            Map<String, Object> cooldowns = (Map<String, Object>) metaMap.get(KEY_COOLDOWNS);
            if (cooldowns == null) {
                cooldowns = new HashMap<>();
            }
            if (timestampStr == null) {
                cooldowns.remove(cooldownKey);
            } else {
                cooldowns.put(cooldownKey, timestampStr);
            }
            metaMap.put(KEY_COOLDOWNS, cooldowns);

            cleanupCooldownsFromCustomFields(metaMap);

            botUser.setMetadata(objectMapper.writeValueAsString(metaMap));
            botUserRepository.saveAndFlush(botUser);
        } catch (Exception e) {
            log.error("Failed to update contact cooldown: {}", e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public void updateContactCustomField(BotUser botUser, String fieldName, String fieldValue) {
        updateContactCustomField(botUser, DEFAULT_CHAT_SCOPE, fieldName, fieldValue);
    }

    @SuppressWarnings("unchecked")
    public void updateContactCustomField(BotUser botUser, String chatScope, String fieldName, String fieldValue) {
        if (fieldName == null || fieldName.trim().isEmpty()) return;
        String cleanFieldName = fieldName.trim();
        if (cleanFieldName.length() > MAX_FIELD_NAME_LENGTH) {
            cleanFieldName = cleanFieldName.substring(0, MAX_FIELD_NAME_LENGTH);
        }
        cleanFieldName = cleanFieldName.replaceAll("[^a-zA-Z0-9_\\-\\.]", "");
        if (cleanFieldName.isEmpty()) return;

        if (cleanFieldName.toLowerCase().contains(KEYWORD_COOLDOWN)) {
            String scopedKey = (chatScope != null && !chatScope.isEmpty() && !DEFAULT_CHAT_SCOPE.equalsIgnoreCase(chatScope))
                    ? chatScope + "_" + cleanFieldName
                    : cleanFieldName;
            updateContactCooldown(botUser, scopedKey, fieldValue);
            return;
        }

        String sanitizedValue = fieldValue != null ? fieldValue.trim() : null;
        if (sanitizedValue != null) {
            if (sanitizedValue.length() > MAX_CUSTOM_FIELD_VALUE_LENGTH) {
                sanitizedValue = sanitizedValue.substring(0, MAX_CUSTOM_FIELD_VALUE_LENGTH);
            }
            sanitizedValue = SanitizationUtil.sanitizeForTelegram(sanitizedValue);
        }

        try {
            Map<String, Object> metaMap = new HashMap<>();
            if (botUser.getMetadata() != null && !botUser.getMetadata().trim().isEmpty()) {
                try {
                    metaMap = objectMapper.readValue(botUser.getMetadata(), Map.class);
                } catch (Exception e) {
                    log.error("Failed to parse metadata: {}", e.getMessage());
                }
            }

            cleanupCooldownsFromCustomFields(metaMap);

            if (sanitizedValue == null || sanitizedValue.trim().isEmpty()) {
                Map<String, Object> customFields = (Map<String, Object>) metaMap.get(KEY_CUSTOM_FIELDS);
                if (customFields != null) {
                    customFields.remove(cleanFieldName);
                    metaMap.put(KEY_CUSTOM_FIELDS, customFields);
                }
                Map<String, Object> chatCustomFields = (Map<String, Object>) metaMap.get(KEY_CHAT_CUSTOM_FIELDS);
                if (chatCustomFields != null) {
                    for (Object groupObj : chatCustomFields.values()) {
                        if (groupObj instanceof Map<?, ?> groupMap) {
                            ((Map<String, Object>) groupMap).remove(cleanFieldName);
                        }
                    }
                    metaMap.put(KEY_CHAT_CUSTOM_FIELDS, chatCustomFields);
                }
            } else if (chatScope != null && !chatScope.isEmpty() && !DEFAULT_CHAT_SCOPE.equalsIgnoreCase(chatScope)) {
                Map<String, Object> chatCustomFields = (Map<String, Object>) metaMap.get(KEY_CHAT_CUSTOM_FIELDS);
                if (chatCustomFields == null) {
                    chatCustomFields = new HashMap<>();
                }
                Map<String, Object> groupFields = (Map<String, Object>) chatCustomFields.get(chatScope);
                if (groupFields == null) {
                    groupFields = new HashMap<>();
                }
                if (groupFields.size() < MAX_CUSTOM_FIELDS_COUNT || groupFields.containsKey(cleanFieldName)) {
                    groupFields.put(cleanFieldName, sanitizedValue);
                }
                chatCustomFields.put(chatScope, groupFields);
                metaMap.put(KEY_CHAT_CUSTOM_FIELDS, chatCustomFields);
            } else {
                Map<String, Object> customFields = (Map<String, Object>) metaMap.get(KEY_CUSTOM_FIELDS);
                if (customFields == null) {
                    customFields = new HashMap<>();
                }
                if (customFields.size() < MAX_CUSTOM_FIELDS_COUNT || customFields.containsKey(cleanFieldName)) {
                    customFields.put(cleanFieldName, sanitizedValue);
                }
                metaMap.put(KEY_CUSTOM_FIELDS, customFields);
            }

            botUser.setMetadata(objectMapper.writeValueAsString(metaMap));
            botUserRepository.saveAndFlush(botUser);
        } catch (Exception e) {
            log.error("Failed to update contact custom field: {}", e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public void updateContactMetadataField(BotUser botUser, String key, Object value) {
        try {
            Map<String, Object> metaMap = new HashMap<>();
            if (botUser.getMetadata() != null && !botUser.getMetadata().trim().isEmpty()) {
                try {
                    metaMap = objectMapper.readValue(botUser.getMetadata(), Map.class);
                } catch (Exception e) {
                    log.error("Failed to parse metadata: {}", e.getMessage());
                }
            }
            cleanupCooldownsFromCustomFields(metaMap);
            metaMap.put(key, value);
            botUser.setMetadata(objectMapper.writeValueAsString(metaMap));
            botUserRepository.saveAndFlush(botUser);
        } catch (Exception e) {
            log.error("Failed to update contact metadata field: {}", e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private void cleanupCooldownsFromCustomFields(Map<String, Object> metaMap) {
        if (metaMap == null) return;

        Object cfObj = metaMap.get(KEY_CUSTOM_FIELDS);
        if (cfObj instanceof Map<?, ?> cfMap) {
            Map<String, Object> customFields = new HashMap<>((Map<String, Object>) cfMap);
            customFields.keySet().removeIf(k -> k != null && k.toLowerCase().contains(KEYWORD_COOLDOWN));
            metaMap.put(KEY_CUSTOM_FIELDS, customFields);
        }

        Object ccfObj = metaMap.get(KEY_CHAT_CUSTOM_FIELDS);
        if (ccfObj instanceof Map<?, ?> ccfMap) {
            Map<String, Object> chatCustomFields = new HashMap<>((Map<String, Object>) ccfMap);
            for (Map.Entry<String, Object> entry : chatCustomFields.entrySet()) {
                if (entry.getValue() instanceof Map<?, ?> groupMap) {
                    Map<String, Object> cleanedGroup = new HashMap<>((Map<String, Object>) groupMap);
                    cleanedGroup.keySet().removeIf(k -> k != null && k.toLowerCase().contains(KEYWORD_COOLDOWN));
                    entry.setValue(cleanedGroup);
                }
            }
            metaMap.put(KEY_CHAT_CUSTOM_FIELDS, chatCustomFields);
        }
    }

    public void setContactField(BotUser botUser, Long botId, Long telegramUserId, String fieldName, String value, Map<String, String> sessionData) {
        String trimmed = fieldName.trim();
        if (trimmed.equalsIgnoreCase(FIELD_FIRST_NAME) || trimmed.equalsIgnoreCase(FIELD_FIRST_NAME_LABEL)) {
            botUser.setFirstName(value);
            botUserRepository.save(botUser);
        } else if (trimmed.equalsIgnoreCase(FIELD_LAST_NAME) || trimmed.equalsIgnoreCase(FIELD_LAST_NAME_LABEL)) {
            botUser.setLastName(value);
            botUserRepository.save(botUser);
        } else if (trimmed.equalsIgnoreCase(FIELD_USERNAME) || trimmed.equalsIgnoreCase(FIELD_TELEGRAM_USERNAME) || trimmed.equalsIgnoreCase(FIELD_TELEGRAM_USERNAME_LABEL)) {
            botUser.setUsername(value);
            botUserRepository.save(botUser);
        } else if (trimmed.equalsIgnoreCase(FIELD_PHONE) || trimmed.equalsIgnoreCase(FIELD_PHONE_LABEL)) {
            stateService.setSessionData(botId, telegramUserId, FIELD_PHONE, value);
            updateContactMetadataField(botUser, FIELD_PHONE, value);
        } else if (trimmed.equalsIgnoreCase(FIELD_EMAIL) || trimmed.equalsIgnoreCase(FIELD_EMAIL_LABEL)) {
            stateService.setSessionData(botId, telegramUserId, FIELD_EMAIL, value);
            updateContactMetadataField(botUser, FIELD_EMAIL, value);
        } else if (trimmed.toLowerCase().contains(KEYWORD_COOLDOWN)) {
            stateService.setSessionData(botId, telegramUserId, trimmed, value);
            updateContactCooldown(botUser, trimmed, value);
        } else {
            stateService.setSessionData(botId, telegramUserId, trimmed, value);
            updateContactCustomField(botUser, trimmed, value);
        }
    }
}
