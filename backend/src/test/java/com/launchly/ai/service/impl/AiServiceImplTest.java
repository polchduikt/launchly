package com.launchly.ai.service.impl;

import tools.jackson.databind.ObjectMapper;
import com.launchly.ai.dto.request.AiChatRequest;
import com.launchly.ai.dto.request.AiSchemaRequest;
import com.launchly.ai.dto.response.AiChatResponse;
import com.launchly.ai.dto.response.AiSchemaResponse;
import com.launchly.ai.dto.response.AiUsageResponse;
import com.launchly.ai.service.AiProviderRouter;
import com.launchly.ai.service.AiUsageService;
import com.launchly.billing.entity.Plan;
import com.launchly.billing.service.PlanLimitService;
import com.launchly.common.exception.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiServiceImplTest {

    @Mock
    private AiProviderRouter aiProviderRouter;

    @Mock
    private AiUsageService aiUsageService;

    @Mock
    private PlanLimitService planLimitService;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private AiServiceImpl aiService;

    private Plan testPlan;

    @BeforeEach
    void setUp() {
        testPlan = new Plan();
        testPlan.setId(1L);
        testPlan.setName("PRO");
    }

    @Test
    @DisplayName("Should execute chat and record usage successfully")
    void chat_Success() {
        when(planLimitService.getActivePlan(1L)).thenReturn(testPlan);
        when(aiProviderRouter.chat(anyList(), any())).thenReturn("Hello from AI");
        when(aiUsageService.getUsage(1L, testPlan)).thenReturn(new AiUsageResponse(100L, 1000L, 900L, 90, "2026-09-01T00:00:00Z"));

        AiChatRequest request = new AiChatRequest("Hello", List.of());
        AiChatResponse response = aiService.chat(request, 1L);

        assertThat(response).isNotNull();
        assertThat(response.reply()).isEqualTo("Hello from AI");
        verify(aiUsageService).recordTokenUsage(anyLong(), any(Plan.class), anyInt());
    }

    @Test
    @DisplayName("Should throw ServiceUnavailable when chat fallback is invoked")
    void chatFallback_ThrowsServiceUnavailable() {
        AiChatRequest request = new AiChatRequest("Hello", List.of());

        assertThatThrownBy(() -> aiService.chatFallback(request, 1L, new RuntimeException("API down")))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.SERVICE_UNAVAILABLE);
    }

    @Test
    @DisplayName("Should throw ServiceUnavailable when generateSchema fallback is invoked")
    void generateSchemaFallback_ThrowsServiceUnavailable() {
        AiSchemaRequest request = new AiSchemaRequest("E-commerce bot", List.of());

        assertThatThrownBy(() -> aiService.generateSchemaFallback(request, 1L, new RuntimeException("API down")))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.SERVICE_UNAVAILABLE);
    }

    @Test
    @DisplayName("Should return usage for user")
    void getUsage_Success() {
        when(planLimitService.getActivePlan(1L)).thenReturn(testPlan);
        when(aiUsageService.getUsage(1L, testPlan)).thenReturn(new AiUsageResponse(50L, 1000L, 950L, 95, "2026-09-01T00:00:00Z"));

        AiUsageResponse usage = aiService.getUsage(1L);

        assertThat(usage).isNotNull();
        assertThat(usage.tokensUsed()).isEqualTo(50L);
    }
}
