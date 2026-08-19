package com.launchly.billing.controller;

import com.launchly.billing.service.BillingService;
import com.launchly.common.exception.AppException;
import com.launchly.common.exception.GlobalExceptionHandler;
import com.launchly.common.utils.MessageUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class StripeWebhookControllerTest {

    private MockMvc mockMvc;

    @Mock
    private BillingService billingService;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private StripeWebhookController stripeWebhookController;

    @BeforeEach
    void setUp() {
        GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler(messageUtils);
        mockMvc = MockMvcBuilders.standaloneSetup(stripeWebhookController)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/billing/webhook - Should process Stripe webhook and return 200 OK")
    void handleWebhook_Success() throws Exception {
        String payload = "{\"type\": \"checkout.session.completed\"}";
        String signature = "t=12345,v1=signature_hash";

        mockMvc.perform(post("/api/v1/billing/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Stripe-Signature", signature)
                        .content(payload))
                .andExpect(status().isOk());

        verify(billingService, times(1)).handleStripeWebhook(payload, signature);
    }

    @Test
    @DisplayName("POST /api/v1/billing/webhook - Should return 400 Bad Request when signature is invalid")
    void handleWebhook_InvalidSignature_ReturnsBadRequest() throws Exception {
        String payload = "{\"type\": \"checkout.session.completed\"}";
        String signature = "invalid_sig";

        doThrow(new AppException(HttpStatus.BAD_REQUEST, "billing.error.invalid_signature"))
                .when(billingService).handleStripeWebhook(payload, signature);

        mockMvc.perform(post("/api/v1/billing/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Stripe-Signature", signature)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }
}
