package com.launchly.bot.service.impl;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.launchly.bot.service.FlowEngineService;
import com.launchly.bot.service.TelegramWebhookService;
import com.launchly.bot.telegram.TelegramBotManager;
import com.launchly.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelegramWebhookServiceImpl implements TelegramWebhookService {

    private final FlowEngineService flowEngineService;
    private final TelegramBotManager telegramBotManager;

    private static final ObjectMapper TELEGRAM_MAPPER = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    @Override
    public void processWebhookUpdate(Long botId, String rawUpdate) {
        TelegramClient client = telegramBotManager.getTelegramClient(botId);
        if (client == null) {
            throw new AppException(HttpStatus.NOT_FOUND, "bot.error.not_found");
        }

        try {
            Update update = TELEGRAM_MAPPER.readValue(rawUpdate, Update.class);
            flowEngineService.processUpdate(botId, update, client);
        } catch (Exception e) {
            log.error("Failed to parse Telegram webhook update for bot {}: {}", botId, e.getMessage());
            throw new AppException(HttpStatus.BAD_REQUEST, "bot.error.invalid_update");
        }
    }
}
