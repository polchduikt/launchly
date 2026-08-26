package com.launchly.bot.service;

import com.launchly.bot.telegram.TelegramBotManager;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.methods.send.SendPhoto;
import org.telegram.telegrambots.meta.api.objects.InputFile;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.telegram.telegrambots.meta.generics.TelegramClient;

@Slf4j
@Service
public class TelegramSendService {

    private final TelegramBotManager botManager;

    @Autowired
    public TelegramSendService(@Lazy TelegramBotManager botManager) {
        this.botManager = botManager;
    }

    @CircuitBreaker(name = "telegram", fallbackMethod = "sendMessageFallback")
    @Retry(name = "telegram")
    public void sendMessage(Long botId, Long telegramUserId, String text) {
        TelegramClient client = botManager.getTelegramClient(botId);
        if (client == null) {
            log.warn("Telegram client not found for bot {}", botId);
            return;
        }
        try {
            client.execute(SendMessage.builder()
                    .chatId(telegramUserId.toString())
                    .text(text)
                    .build());
            log.info("Sent Telegram message to user {} from bot {}", telegramUserId, botId);
        } catch (TelegramApiException e) {
            log.error("Failed to send message to user {} from bot {}: {}", telegramUserId, botId, e.getMessage());
        }
    }

    @CircuitBreaker(name = "telegram", fallbackMethod = "sendPhotoFallback")
    @Retry(name = "telegram")
    public void sendPhoto(Long botId, Long telegramUserId, String photoUrl, String caption) {
        TelegramClient client = botManager.getTelegramClient(botId);
        if (client == null) {
            log.warn("Telegram client not found for bot {}", botId);
            return;
        }
        try {
            SendPhoto sendPhoto = SendPhoto.builder()
                    .chatId(telegramUserId.toString())
                    .photo(new InputFile(photoUrl))
                    .caption(caption != null ? caption : "")
                    .build();
            client.execute(sendPhoto);
            log.info("Sent Telegram photo to user {} from bot {}", telegramUserId, botId);
        } catch (TelegramApiException e) {
            log.error("Failed to send photo to user {} from bot {}: {}", telegramUserId, botId, e.getMessage());
        }
    }

    public void sendMessageFallback(Long botId, Long telegramUserId, String text, Throwable t) {
        log.warn("Telegram sendMessage fallback triggered for botId={}, userId={}: {}", botId, telegramUserId, t.getMessage());
    }

    public void sendPhotoFallback(Long botId, Long telegramUserId, String photoUrl, String caption, Throwable t) {
        log.warn("Telegram sendPhoto fallback triggered for botId={}, userId={}: {}", botId, telegramUserId, t.getMessage());
    }
}
