package com.launchly.bot.service.impl;

import com.launchly.bot.service.FlowEngineService;
import com.launchly.bot.telegram.TelegramBotManager;
import com.launchly.common.exception.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TelegramWebhookServiceImplTest {

    @Mock
    private FlowEngineService flowEngineService;

    @Mock
    private TelegramBotManager telegramBotManager;

    private TelegramWebhookServiceImpl webhookService;

    @BeforeEach
    void setUp() {
        webhookService = new TelegramWebhookServiceImpl(flowEngineService, telegramBotManager);
    }

    @Test
    @DisplayName("Should process update successfully when client is found")
    void shouldProcessUpdateSuccessfully() {
        TelegramClient client = mock(TelegramClient.class);
        when(telegramBotManager.getTelegramClient(10L)).thenReturn(client);

        webhookService.processWebhookUpdate(10L, "{\"update_id\": 12345}");

        verify(flowEngineService, times(1)).processUpdate(eq(10L), any(Update.class), eq(client));
    }

    @Test
    @DisplayName("Should throw 404 NOT_FOUND when client is not found")
    void shouldThrowNotFoundWhenClientNotFound() {
        when(telegramBotManager.getTelegramClient(99L)).thenReturn(null);

        assertThatThrownBy(() -> webhookService.processWebhookUpdate(99L, "{\"update_id\": 12345}"))
                .isInstanceOf(AppException.class)
                .satisfies(e -> {
                    AppException ex = (AppException) e;
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(ex.getMessage()).isEqualTo("bot.error.not_found");
                });

        verifyNoInteractions(flowEngineService);
    }

    @Test
    @DisplayName("Should throw 400 BAD_REQUEST on invalid JSON")
    void shouldThrowBadRequestOnInvalidJson() {
        TelegramClient client = mock(TelegramClient.class);
        when(telegramBotManager.getTelegramClient(10L)).thenReturn(client);

        assertThatThrownBy(() -> webhookService.processWebhookUpdate(10L, "invalid json"))
                .isInstanceOf(AppException.class)
                .satisfies(e -> {
                    AppException ex = (AppException) e;
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getMessage()).isEqualTo("bot.error.invalid_update");
                });

        verifyNoInteractions(flowEngineService);
    }
}
