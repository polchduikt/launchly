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
    public void updateContactCustomField(BotUser botUser, String fieldName, String fieldValue) {
        try {
            Map<String, Object> metaMap = new HashMap<>();
            if (botUser.getMetadata() != null && !botUser.getMetadata().trim().isEmpty()) {
                try {
                    metaMap = objectMapper.readValue(botUser.getMetadata(), Map.class);
                } catch (Exception e) {
                    log.error("Failed to parse metadata: {}", e.getMessage());
                }
            }
            Map<String, Object> customFields = (Map<String, Object>) metaMap.get("customFields");
            if (customFields == null) {
                customFields = new HashMap<>();
            }
            if (fieldValue == null) {
                customFields.remove(fieldName);
            } else {
                customFields.put(fieldName, fieldValue);
            }
            metaMap.put("customFields", customFields);
            botUser.setMetadata(objectMapper.writeValueAsString(metaMap));
            botUserRepository.save(botUser);
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
            metaMap.put(key, value);
            botUser.setMetadata(objectMapper.writeValueAsString(metaMap));
            botUserRepository.save(botUser);
        } catch (Exception e) {
            log.error("Failed to update contact metadata field: {}", e.getMessage(), e);
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
        } else {
            stateService.setSessionData(botId, telegramUserId, trimmed, value);
            updateContactCustomField(botUser, trimmed, value);
        }
    }
}
