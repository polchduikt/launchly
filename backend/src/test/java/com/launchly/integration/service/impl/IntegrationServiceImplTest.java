package com.launchly.integration.service.impl;

import tools.jackson.databind.ObjectMapper;
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
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
        testBot = Bot.builder().name("Shop Bot").build();
        ReflectionTestUtils.setField(testBot, "id", 10L);

        testIntegration = Integration.builder()
                .name("CRM Webhook")
                .type(IntegrationType.WEBHOOK)
                .bot(testBot)
                .config("{\"url\":\"https://example.com/hook\"}")
                .active(true)
                .build();
        ReflectionTestUtils.setField(testIntegration, "id", 100L);

        mockResponse = mock(IntegrationResponse.class);
    }

    @Test
    @DisplayName("Should return integrations list for user")
    void getIntegrations_Success() {
        when(integrationRepository.findAllByBotUserId(1L)).thenReturn(List.of(testIntegration));
        when(integrationMapper.toResponseList(List.of(testIntegration))).thenReturn(List.of(mockResponse));

        List<IntegrationResponse> list = integrationService.getIntegrations(1L);

        assertThat(list).hasSize(1);
    }

    @Test
    @DisplayName("Should create third-party integration successfully")
    void createIntegration_Success() throws Exception {
        IntegrationCreateRequest request = new IntegrationCreateRequest(
                "CRM Webhook",
                IntegrationType.WEBHOOK,
                10L,
                Map.of("url", "https://example.com/hook")
        );

        when(botRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBot));
        when(objectMapper.writeValueAsString(any())).thenReturn("{\"url\":\"https://example.com/hook\"}");
        when(integrationRepository.save(any(Integration.class))).thenReturn(testIntegration);
        when(integrationMapper.toResponse(any(Integration.class))).thenReturn(mockResponse);

        IntegrationResponse response = integrationService.createIntegration(request, 1L);

        assertThat(response).isNotNull();
        verify(planLimitService, times(1)).checkIntegrationAccess(1L);
        verify(integrationConfigValidator, times(1)).validateConfig(eq(IntegrationType.WEBHOOK), anyString());
    }

    @Test
    @DisplayName("Should throw Forbidden when subscription does not allow integrations")
    void createIntegration_WhenPlanDisallows_ThrowsForbidden() {
        IntegrationCreateRequest request = new IntegrationCreateRequest(
                "CRM Webhook",
                IntegrationType.WEBHOOK,
                10L,
                Map.of("url", "https://example.com/hook")
        );

        doThrow(new AppException(HttpStatus.FORBIDDEN, "billing.error.feature_not_available"))
                .when(planLimitService).checkIntegrationAccess(1L);

        assertThatThrownBy(() -> integrationService.createIntegration(request, 1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Should update existing integration")
    void updateIntegration_Success() throws Exception {
        IntegrationCreateRequest request = new IntegrationCreateRequest(
                "Updated Webhook",
                IntegrationType.WEBHOOK,
                10L,
                Map.of("url", "https://new-url.com")
        );

        when(integrationRepository.findById(100L)).thenReturn(Optional.of(testIntegration));
        when(botRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBot));
        when(objectMapper.writeValueAsString(any())).thenReturn("{\"url\":\"https://new-url.com\"}");
        when(integrationRepository.save(any(Integration.class))).thenReturn(testIntegration);
        when(integrationMapper.toResponse(any(Integration.class))).thenReturn(mockResponse);

        IntegrationResponse response = integrationService.updateIntegration(100L, request, 1L);

        assertThat(response).isNotNull();
        verify(integrationRepository, times(1)).save(testIntegration);
    }

    @Test
    @DisplayName("Should throw NotFound when updating non-existent integration")
    void updateIntegration_WhenNotFound_ThrowsNotFound() {
        IntegrationCreateRequest request = new IntegrationCreateRequest(
                "Updated Webhook",
                IntegrationType.WEBHOOK,
                10L,
                null
        );
        when(integrationRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> integrationService.updateIntegration(999L, request, 1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("Should toggle integration active state")
    void toggleIntegration_Success() {
        when(integrationRepository.findById(100L)).thenReturn(Optional.of(testIntegration));
        when(botRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBot));
        when(integrationRepository.save(testIntegration)).thenReturn(testIntegration);
        when(integrationMapper.toResponse(testIntegration)).thenReturn(mockResponse);

        IntegrationResponse response = integrationService.toggleIntegration(100L, 1L);

        assertThat(response).isNotNull();
        assertThat(testIntegration.isActive()).isFalse();
    }

    @Test
    @DisplayName("Should delete integration by ID")
    void deleteIntegration_Success() {
        when(integrationRepository.findById(100L)).thenReturn(Optional.of(testIntegration));
        when(botRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBot));

        integrationService.deleteIntegration(100L, 1L);

        verify(integrationRepository, times(1)).delete(testIntegration);
    }

    @Test
    @DisplayName("Should throw NotFound when deleting non-existent integration")
    void deleteIntegration_WhenNotFound_ThrowsNotFound() {
        when(integrationRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> integrationService.deleteIntegration(999L, 1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.NOT_FOUND);
    }
}
