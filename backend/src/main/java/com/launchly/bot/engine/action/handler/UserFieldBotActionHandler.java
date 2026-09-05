package com.launchly.bot.engine.action.handler;

import com.launchly.bot.engine.action.ActionContactManager;
import com.launchly.bot.engine.action.ActionPlaceholderResolver;
import com.launchly.bot.engine.action.BotActionHandler;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.service.BotDialogStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserFieldBotActionHandler implements BotActionHandler {

    private final BotDialogStateService stateService;
    private final ActionPlaceholderResolver placeholderResolver;
    private final ActionContactManager contactManager;

    @Override
    public Set<String> getSupportedTypes() {
        return Set.of("SET_USER_FIELD", "CLEAR_USER_FIELD");
    }

    @Override
    public void execute(String type, Map<String, Object> action, BotUser botUser, Map<String, String> sessionData) {
        Long botId = botUser.getBot().getId();
        Long telegramUserId = botUser.getTelegramId();
        String fieldName = (String) action.get("fieldName");

        if (fieldName == null || fieldName.trim().isEmpty()) {
            return;
        }
        String cleanFieldName = fieldName.trim();

        if ("SET_USER_FIELD".equals(type)) {
            String fieldValue = (String) action.get("fieldValue");
            String resolvedValue = placeholderResolver.resolveValue(fieldValue, sessionData, botUser);
            stateService.setSessionData(botId, telegramUserId, cleanFieldName, resolvedValue);
            contactManager.updateContactCustomField(botUser, cleanFieldName, resolvedValue);
            log.info("Set field '{}' = '{}' for user {}", cleanFieldName, resolvedValue, telegramUserId);
        } else if ("CLEAR_USER_FIELD".equals(type)) {
            stateService.setSessionData(botId, telegramUserId, cleanFieldName, "");
            contactManager.updateContactCustomField(botUser, cleanFieldName, null);
            log.info("Cleared field '{}' for user {}", cleanFieldName, telegramUserId);
        }
    }
}
