package com.launchly.bot.telegram;

import com.launchly.bot.service.FlowEngineService;
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

    @Override
    public void consume(Update update) {
        try {
            flowEngineService.processUpdate(botId, update, telegramClient);
        } catch (Exception e) {
            log.error("Error handling update for bot {}: {}", botId, e.getMessage(), e);
        }
    }
}
