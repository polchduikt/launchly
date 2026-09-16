package com.launchly.integration.controller;

import com.launchly.common.exception.GlobalExceptionHandler;
import com.launchly.common.utils.MessageUtils;
import com.launchly.integration.service.HotmartService;
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

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class HotmartWebhookControllerTest {

    private MockMvc mockMvc;

    @Mock
    private HotmartService hotmartService;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private HotmartWebhookController hotmartWebhookController;

    @BeforeEach
    void setUp() {
        GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler(messageUtils);
        mockMvc = MockMvcBuilders.standaloneSetup(hotmartWebhookController)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/integrations/hotmart/webhook - Should process Hotmart webhook and return 200 OK")
    void handleWebhook_Success() throws Exception {
        String payload = "{\"event\": \"PURCHASE_COMPLETE\"}";
        String hottok = "tok_hotmart_123";

        mockMvc.perform(post("/api/v1/integrations/hotmart/webhook")
                        .param("botId", "10")
                        .header("X-Hotmart-Hottok", hottok)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"));

        verify(hotmartService, times(1)).processWebhook(10L, hottok, payload);
    }
}
