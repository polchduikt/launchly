package com.launchly.bot.service;

import com.launchly.bot.telegram.TelegramBotManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.methods.send.SendPhoto;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TelegramSendServiceTest {

    @Mock
    private TelegramBotManager botManager;

    @Mock
    private TelegramClient telegramClient;

    @InjectMocks
    private TelegramSendService telegramSendService;

    @Test
    @DisplayName("Should send message via TelegramClient successfully")
    void sendMessage_Success() throws Exception {
        when(botManager.getTelegramClient(1L)).thenReturn(telegramClient);

        telegramSendService.sendMessage(1L, 123456L, "Hello test");

        verify(telegramClient).execute(any(SendMessage.class));
    }

    @Test
    @DisplayName("Should send photo via TelegramClient successfully")
    void sendPhoto_Success() throws Exception {
        when(botManager.getTelegramClient(1L)).thenReturn(telegramClient);

        telegramSendService.sendPhoto(1L, 123456L, "https://example.com/photo.jpg", "Photo caption");

        verify(telegramClient).execute(any(SendPhoto.class));
    }

    @Test
    @DisplayName("Should gracefully handle sendMessage fallback when circuit opens")
    void sendMessageFallback_ExecutesGracefully() {
        assertDoesNotThrow(() -> telegramSendService.sendMessageFallback(
                1L, 123456L, "Hello test", new RuntimeException("Telegram API down")));
    }

    @Test
    @DisplayName("Should gracefully handle sendPhoto fallback when circuit opens")
    void sendPhotoFallback_ExecutesGracefully() {
        assertDoesNotThrow(() -> telegramSendService.sendPhotoFallback(
                1L, 123456L, "https://example.com/photo.jpg", "Caption", new RuntimeException("Telegram API down")));
    }
}
