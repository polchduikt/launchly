package com.launchly.bot.controller;

import com.launchly.bot.service.TelegramWebhookService;
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

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TelegramWebhookControllerTest {

    private MockMvc mockMvc;

    @Mock
    private TelegramWebhookService telegramWebhookService;

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
    @DisplayName("POST /api/v1/telegram/webhook/{botId} - Should call webhook service and return 200 OK")
    void handleUpdate_ReturnsOk() throws Exception {
        mockMvc.perform(post("/api/v1/telegram/webhook/10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"update_id\": 12345}"))
                .andExpect(status().isOk());

        verify(telegramWebhookService, times(1)).processWebhookUpdate(eq(10L), eq("{\"update_id\": 12345}"));
    }
}
