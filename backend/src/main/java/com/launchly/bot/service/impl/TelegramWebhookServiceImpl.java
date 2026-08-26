package com.launchly.bot.service.impl;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.launchly.bot.service.FlowEngineService;
import com.launchly.bot.service.TelegramWebhookService;
import com.launchly.bot.telegram.TelegramBotManager;
import com.launchly.common.exception.AppException;
import com.launchly.common.ratelimit.RateLimitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelegramWebhookServiceImpl implements TelegramWebhookService {

    private final FlowEngineService flowEngineService;
    private final TelegramBotManager telegramBotManager;
    private final RateLimitService rateLimitService;
    private final StringRedisTemplate stringRedisTemplate;

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

            if (update.getUpdateId() != null) {
                String dedupKey = "telegram:update:" + botId + ":" + update.getUpdateId();
                Boolean isNew = stringRedisTemplate.opsForValue().setIfAbsent(dedupKey, "1", Duration.ofSeconds(120));
                if (Boolean.FALSE.equals(isNew)) {
                    log.info("Duplicate Telegram update ignored: botId={}, updateId={}", botId, update.getUpdateId());
                    return;
                }
            }

            Long telegramUserId = extractTelegramUserId(update);
            if (telegramUserId != null) {
                String rateKey = "rate:tg:user:" + botId + ":" + telegramUserId;
                if (!rateLimitService.isAllowed(rateKey, 30, Duration.ofMinutes(1))) {
                    log.warn("Rate limit exceeded for Telegram user {} in bot {}", telegramUserId, botId);
                    return;
                }
            }

            flowEngineService.processUpdate(botId, update, client);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to parse Telegram webhook update for bot {}: {}", botId, e.getMessage());
            throw new AppException(HttpStatus.BAD_REQUEST, "bot.error.invalid_update");
        }
    }

    private Long extractTelegramUserId(Update update) {
        if (update.hasMessage() && update.getMessage().getFrom() != null) {
            return update.getMessage().getFrom().getId();
        }
        if (update.hasCallbackQuery() && update.getCallbackQuery().getFrom() != null) {
            return update.getCallbackQuery().getFrom().getId();
        }
        if (update.hasChannelPost() && update.getChannelPost().getFrom() != null) {
            return update.getChannelPost().getFrom().getId();
        }
        return null;
    }
}
