package com.launchly.bot.engine.action;

import com.launchly.bot.entity.BotUser;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.service.BotDialogStateService;
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

            Map<String, Object> cooldowns = (Map<String, Object>) metaMap.get("cooldowns");
            if (cooldowns == null) {
                cooldowns = new HashMap<>();
            }
            if (timestampStr == null) {
                cooldowns.remove(cooldownKey);
            } else {
                cooldowns.put(cooldownKey, timestampStr);
            }
            metaMap.put("cooldowns", cooldowns);

            cleanupCooldownsFromCustomFields(metaMap);

            botUser.setMetadata(objectMapper.writeValueAsString(metaMap));
            botUserRepository.saveAndFlush(botUser);
        } catch (Exception e) {
            log.error("Failed to update contact cooldown: {}", e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    public void updateContactCustomField(BotUser botUser, String fieldName, String fieldValue) {
        updateContactCustomField(botUser, "private", fieldName, fieldValue);
    }

    @SuppressWarnings("unchecked")
    public void updateContactCustomField(BotUser botUser, String chatScope, String fieldName, String fieldValue) {
        if (fieldName != null && fieldName.toLowerCase().contains("cooldown")) {
            String scopedKey = (chatScope != null && !chatScope.isEmpty() && !"private".equalsIgnoreCase(chatScope))
                    ? chatScope + "_" + fieldName
                    : fieldName;
            updateContactCooldown(botUser, scopedKey, fieldValue);
            return;
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

            if (fieldValue == null || fieldValue.trim().isEmpty()) {
                Map<String, Object> customFields = (Map<String, Object>) metaMap.get("customFields");
                if (customFields != null) {
                    customFields.remove(fieldName);
                    metaMap.put("customFields", customFields);
                }
                Map<String, Object> chatCustomFields = (Map<String, Object>) metaMap.get("chatCustomFields");
                if (chatCustomFields != null) {
                    for (Object groupObj : chatCustomFields.values()) {
                        if (groupObj instanceof Map<?, ?> groupMap) {
                            ((Map<String, Object>) groupMap).remove(fieldName);
                        }
                    }
                    metaMap.put("chatCustomFields", chatCustomFields);
                }
            } else if (chatScope != null && !chatScope.isEmpty() && !"private".equalsIgnoreCase(chatScope)) {
                Map<String, Object> chatCustomFields = (Map<String, Object>) metaMap.get("chatCustomFields");
                if (chatCustomFields == null) {
                    chatCustomFields = new HashMap<>();
                }
                Map<String, Object> groupFields = (Map<String, Object>) chatCustomFields.get(chatScope);
                if (groupFields == null) {
                    groupFields = new HashMap<>();
                }
                groupFields.put(fieldName, fieldValue);
                chatCustomFields.put(chatScope, groupFields);
                metaMap.put("chatCustomFields", chatCustomFields);
            } else {
                Map<String, Object> customFields = (Map<String, Object>) metaMap.get("customFields");
                if (customFields == null) {
                    customFields = new HashMap<>();
                }
                customFields.put(fieldName, fieldValue);
                metaMap.put("customFields", customFields);
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

        Object cfObj = metaMap.get("customFields");
        if (cfObj instanceof Map<?, ?> cfMap) {
            Map<String, Object> customFields = new HashMap<>((Map<String, Object>) cfMap);
            customFields.keySet().removeIf(k -> k != null && k.toLowerCase().contains("cooldown"));
            metaMap.put("customFields", customFields);
        }

        Object ccfObj = metaMap.get("chatCustomFields");
        if (ccfObj instanceof Map<?, ?> ccfMap) {
            Map<String, Object> chatCustomFields = new HashMap<>((Map<String, Object>) ccfMap);
            for (Map.Entry<String, Object> entry : chatCustomFields.entrySet()) {
                if (entry.getValue() instanceof Map<?, ?> groupMap) {
                    Map<String, Object> cleanedGroup = new HashMap<>((Map<String, Object>) groupMap);
                    cleanedGroup.keySet().removeIf(k -> k != null && k.toLowerCase().contains("cooldown"));
                    entry.setValue(cleanedGroup);
                }
            }
            metaMap.put("chatCustomFields", chatCustomFields);
        }
    }

    public void setContactField(BotUser botUser, Long botId, Long telegramUserId, String fieldName, String value, Map<String, String> sessionData) {
        String trimmed = fieldName.trim();
        if (trimmed.equalsIgnoreCase("first_name") || trimmed.equalsIgnoreCase("First Name")) {
            botUser.setFirstName(value);
            botUserRepository.save(botUser);
        } else if (trimmed.equalsIgnoreCase("last_name") || trimmed.equalsIgnoreCase("Last Name")) {
            botUser.setLastName(value);
            botUserRepository.save(botUser);
        } else if (trimmed.equalsIgnoreCase("username") || trimmed.equalsIgnoreCase("telegram_username") || trimmed.equalsIgnoreCase("Telegram Username")) {
            botUser.setUsername(value);
            botUserRepository.save(botUser);
        } else if (trimmed.equalsIgnoreCase("phone") || trimmed.equalsIgnoreCase("Phone")) {
            stateService.setSessionData(botId, telegramUserId, "phone", value);
            updateContactMetadataField(botUser, "phone", value);
        } else if (trimmed.equalsIgnoreCase("email") || trimmed.equalsIgnoreCase("Email")) {
            stateService.setSessionData(botId, telegramUserId, "email", value);
            updateContactMetadataField(botUser, "email", value);
        } else if (trimmed.toLowerCase().contains("cooldown")) {
            stateService.setSessionData(botId, telegramUserId, trimmed, value);
            updateContactCooldown(botUser, trimmed, value);
        } else {
            stateService.setSessionData(botId, telegramUserId, trimmed, value);
            updateContactCustomField(botUser, trimmed, value);
        }
    }
}
