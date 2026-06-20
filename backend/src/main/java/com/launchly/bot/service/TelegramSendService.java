package com.launchly.bot.service;

import com.launchly.bot.telegram.TelegramBotManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
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

    public void sendPhoto(Long botId, Long telegramUserId, String photoUrl, String caption) {
        TelegramClient client = botManager.getTelegramClient(botId);
        if (client == null) {
            log.warn("Telegram client not found for bot {}", botId);
            return;
        }
        try {
            org.telegram.telegrambots.meta.api.methods.send.SendPhoto sendPhoto = org.telegram.telegrambots.meta.api.methods.send.SendPhoto.builder()
                    .chatId(telegramUserId.toString())
                    .photo(new org.telegram.telegrambots.meta.api.objects.InputFile(photoUrl))
                    .caption(caption != null ? caption : "")
                    .build();
            client.execute(sendPhoto);
            log.info("Sent Telegram photo to user {} from bot {}", telegramUserId, botId);
        } catch (TelegramApiException e) {
            log.error("Failed to send photo to user {} from bot {}: {}", telegramUserId, botId, e.getMessage());
        }
    }
}
