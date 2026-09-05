package com.launchly.bot.engine.action.handler;

import com.launchly.bot.engine.action.ActionContactManager;
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
public class TelegramSubscriptionBotActionHandler implements BotActionHandler {

    private final BotDialogStateService stateService;
    private final ActionContactManager contactManager;

    @Override
    public Set<String> getSupportedTypes() {
        return Set.of("TELEGRAM_SUBSCRIBE", "TELEGRAM_UNSUBSCRIBE");
    }

    @Override
    public void execute(String type, Map<String, Object> action, BotUser botUser, Map<String, String> sessionData) {
        Long botId = botUser.getBot().getId();
        Long telegramUserId = botUser.getTelegramId();

        if ("TELEGRAM_SUBSCRIBE".equals(type)) {
            stateService.setSessionData(botId, telegramUserId, "telegram_opt_in", "true");
            contactManager.updateContactMetadataField(botUser, "telegram_opt_in", true);
            log.info("Subscribed user {} to Telegram updates", telegramUserId);
        } else if ("TELEGRAM_UNSUBSCRIBE".equals(type)) {
            stateService.setSessionData(botId, telegramUserId, "telegram_opt_in", "false");
            contactManager.updateContactMetadataField(botUser, "telegram_opt_in", false);
            log.info("Unsubscribed user {} from Telegram updates", telegramUserId);
        }
    }
}
