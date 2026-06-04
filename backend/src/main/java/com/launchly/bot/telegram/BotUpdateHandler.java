package com.launchly.bot.telegram;

import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.service.FlowEngineService;
import com.launchly.crm.service.CrmService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.telegram.telegrambots.longpolling.util.LongPollingSingleThreadUpdateConsumer;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

@Slf4j
@RequiredArgsConstructor
public class BotUpdateHandler implements LongPollingSingleThreadUpdateConsumer {

    private final Long botId;
    private final FlowEngineService flowEngineService;
    private final TelegramClient telegramClient;
    private final CrmService crmService;
    private final BotUserRepository botUserRepository;

    @Override
    public void consume(Update update) {
        try {
            saveIncomingMessageToCrm(update);
            flowEngineService.processUpdate(botId, update, telegramClient);
        } catch (Exception e) {
            log.error("Error handling update for bot {}: {}", botId, e.getMessage(), e);
        }
    }

    private void saveIncomingMessageToCrm(Update update) {
        if (!update.hasMessage() || !update.getMessage().hasText()) {
            return;
        }
        try {
            Long telegramUserId = update.getMessage().getFrom().getId();
            String text = update.getMessage().getText();
            if (text.startsWith("/")) {
                return;
            }
            botUserRepository.findByTelegramIdAndBotId(telegramUserId, botId)
                    .ifPresent(botUser ->
                            crmService.saveIncomingMessage(botId, botUser.getId(), text));
        } catch (Exception e) {
            log.warn("Failed to save incoming message to CRM for bot {}: {}", botId, e.getMessage());
        }
    }
}
