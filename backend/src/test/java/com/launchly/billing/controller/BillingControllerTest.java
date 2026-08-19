package com.launchly.billing.controller;

import com.launchly.billing.dto.request.CheckoutRequest;
import com.launchly.billing.dto.response.CheckoutResponse;
import com.launchly.billing.dto.response.PlanResponse;
import com.launchly.billing.dto.response.SubscriptionResponse;
import com.launchly.billing.service.BillingService;
import com.launchly.common.exception.AppException;
import com.launchly.common.exception.GlobalExceptionHandler;
import com.launchly.common.security.CustomUserDetails;
import com.launchly.common.utils.MessageUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class BillingControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private BillingService billingService;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private BillingController billingController;

    private CustomUserDetails mockUserDetails;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockUserDetails = mock(CustomUserDetails.class);
        lenient().when(mockUserDetails.getId()).thenReturn(1L);

        HandlerMethodArgumentResolver authResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class)
                        || CustomUserDetails.class.isAssignableFrom(parameter.getParameterType());
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return mockUserDetails;
            }
        };

        GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler(messageUtils);
        mockMvc = MockMvcBuilders.standaloneSetup(billingController)
                .setCustomArgumentResolvers(authResolver)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/billing/plans - Should return available plans list")
    void getPlans_Success() throws Exception {
        PlanResponse plan = PlanResponse.builder().id(2L).name("PRO").price(new BigDecimal("29.99")).build();
        when(billingService.getAvailablePlans()).thenReturn(List.of(plan));

        mockMvc.perform(get("/api/v1/billing/plans"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("PRO"));
    }

    @Test
    @DisplayName("GET /api/v1/billing/subscription - Should return active user subscription")
    void getSubscription_Success() throws Exception {
        SubscriptionResponse sub = mock(SubscriptionResponse.class);
        when(sub.getStatus()).thenReturn("ACTIVE");
        when(billingService.getSubscriptionByUser(1L)).thenReturn(sub);

        mockMvc.perform(get("/api/v1/billing/subscription"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("POST /api/v1/billing/subscription/checkout - Should return checkout url 200 OK")
    void checkout_Success() throws Exception {
        CheckoutRequest request = new CheckoutRequest(2L);
        CheckoutResponse response = new CheckoutResponse("https://checkout.stripe.com/session_123");
        when(billingService.createCheckoutSession(2L, 1L)).thenReturn(response);

        mockMvc.perform(post("/api/v1/billing/subscription/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checkoutUrl").value("https://checkout.stripe.com/session_123"));
    }

    @Test
    @DisplayName("POST /api/v1/billing/subscription/checkout - Should return 400 Bad Request when planId is null")
    void checkout_NullPlan_ReturnsBadRequest() throws Exception {
        CheckoutRequest request = new CheckoutRequest(null);

        mockMvc.perform(post("/api/v1/billing/subscription/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/v1/billing/subscription/cancel - Should cancel subscription")
    void cancelSubscription_Success() throws Exception {
        SubscriptionResponse sub = mock(SubscriptionResponse.class);
        when(sub.getStatus()).thenReturn("ACTIVE");
        when(billingService.cancelSubscription(1L)).thenReturn(sub);

        mockMvc.perform(post("/api/v1/billing/subscription/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("POST /api/v1/billing/subscription/resume - Should resume subscription")
    void resumeSubscription_Success() throws Exception {
        SubscriptionResponse sub = mock(SubscriptionResponse.class);
        when(sub.getStatus()).thenReturn("ACTIVE");
        when(billingService.resumeSubscription(1L)).thenReturn(sub);

        mockMvc.perform(post("/api/v1/billing/subscription/resume"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("POST /api/v1/billing/subscription/confirm-session - Should confirm session")
    void confirmSession_Success() throws Exception {
        SubscriptionResponse sub = mock(SubscriptionResponse.class);
        when(sub.getStatus()).thenReturn("ACTIVE");
        when(billingService.confirmCheckoutSession("sess_123", 1L)).thenReturn(sub);

        mockMvc.perform(post("/api/v1/billing/subscription/confirm-session")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("sessionId", "sess_123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }
}
