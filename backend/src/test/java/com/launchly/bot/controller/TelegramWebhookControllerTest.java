package com.launchly.bot.controller;

import com.launchly.bot.service.FlowEngineService;
import com.launchly.bot.telegram.TelegramBotManager;
import com.launchly.common.exception.GlobalExceptionHandler;
import com.launchly.common.utils.MessageUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TelegramWebhookControllerTest {

    private MockMvc mockMvc;

    @Mock
    private FlowEngineService flowEngineService;

    @Mock
    private TelegramBotManager telegramBotManager;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private TelegramWebhookController webhookController;

    @BeforeEach
    void setUp() {
        GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler(messageUtils);
        mockMvc = MockMvcBuilders.standaloneSetup(webhookController)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/telegram/webhook/{botId} - Should process update with 200 OK when client found")
    void handleUpdate_Found_ReturnsOk() throws Exception {
        TelegramClient client = mock(TelegramClient.class);
        when(telegramBotManager.getTelegramClient(10L)).thenReturn(client);

        mockMvc.perform(post("/api/v1/telegram/webhook/10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"update_id\": 12345}"))
                .andExpect(status().isOk());

        verify(flowEngineService, times(1)).processUpdate(eq(10L), any(Update.class), eq(client));
    }

    @Test
    @DisplayName("POST /api/v1/telegram/webhook/{botId} - Should return 404 Not Found when client not active")
    void handleUpdate_NotFound_ReturnsNotFound() throws Exception {
        when(telegramBotManager.getTelegramClient(99L)).thenReturn(null);

        mockMvc.perform(post("/api/v1/telegram/webhook/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"update_id\": 12345}"))
                .andExpect(status().isNotFound());
    }
}
