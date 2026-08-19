package com.launchly.integration.service.impl;

import com.launchly.billing.service.PlanLimitService;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.repository.BotRepository;
import com.launchly.common.exception.AppException;
import com.launchly.integration.dto.request.IntegrationCreateRequest;
import com.launchly.integration.dto.response.IntegrationResponse;
import com.launchly.integration.entity.Integration;
import com.launchly.integration.entity.IntegrationType;
import com.launchly.integration.mapper.IntegrationMapper;
import com.launchly.integration.repository.IntegrationRepository;
import com.launchly.integration.validator.IntegrationConfigValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IntegrationServiceImplTest {

    @Mock
    private IntegrationRepository integrationRepository;

    @Mock
    private BotRepository botRepository;

    @Mock
    private PlanLimitService planLimitService;

    @Mock
    private IntegrationMapper integrationMapper;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private IntegrationConfigValidator integrationConfigValidator;

    @InjectMocks
    private IntegrationServiceImpl integrationService;

    private Bot testBot;
    private Integration testIntegration;
    private IntegrationResponse mockResponse;

    @BeforeEach
    void setUp() {
        testBot = Bot.builder().name("Test Bot").build();
        ReflectionTestUtils.setField(testBot, "id", 10L);

        testIntegration = Integration.builder()
                .name("CRM Webhook")
                .type(IntegrationType.WEBHOOK)
                .bot(testBot)
                .active(true)
                .build();
        ReflectionTestUtils.setField(testIntegration, "id", 100L);

        mockResponse = mock(IntegrationResponse.class);
    }

    @Test
    @DisplayName("Should successfully create integration when user has plan access")
    void createIntegration_Success() {
        IntegrationCreateRequest request = new IntegrationCreateRequest(
                "CRM Webhook",
                IntegrationType.WEBHOOK,
                10L,
                Map.of("url", "https://example.com/hook")
        );

        when(botRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBot));
        when(integrationRepository.save(any(Integration.class))).thenReturn(testIntegration);
        when(integrationMapper.toResponse(any(Integration.class))).thenReturn(mockResponse);

        IntegrationResponse response = integrationService.createIntegration(request, 1L);

        assertThat(response).isNotNull();
        verify(planLimitService, times(1)).checkIntegrationAccess(1L);
        verify(integrationConfigValidator, times(1)).validateConfig(eq(IntegrationType.WEBHOOK), any());
        verify(integrationRepository, times(1)).save(any(Integration.class));
    }

    @Test
    @DisplayName("Should return integrations for user")
    void getIntegrations_ReturnsList() {
        when(integrationRepository.findAllByBotUserId(1L)).thenReturn(List.of(testIntegration));
        when(integrationMapper.toResponseList(any())).thenReturn(List.of(mockResponse));

        List<IntegrationResponse> list = integrationService.getIntegrations(1L);

        assertThat(list).hasSize(1);
    }

    @Test
    @DisplayName("Should delete integration when owned by user")
    void deleteIntegration_Success() {
        when(integrationRepository.findById(100L)).thenReturn(Optional.of(testIntegration));
        when(botRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBot));

        integrationService.deleteIntegration(100L, 1L);

        verify(integrationRepository, times(1)).delete(testIntegration);
    }
}
