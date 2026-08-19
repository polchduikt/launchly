package com.launchly.integration.controller;

import com.launchly.common.exception.GlobalExceptionHandler;
import com.launchly.common.security.CustomUserDetails;
import com.launchly.common.utils.MessageUtils;
import com.launchly.integration.dto.request.IntegrationCreateRequest;
import com.launchly.integration.dto.response.IntegrationResponse;
import com.launchly.integration.entity.IntegrationType;
import com.launchly.integration.service.ExcelExportService;
import com.launchly.integration.service.GoogleSheetsService;
import com.launchly.integration.service.IntegrationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class IntegrationControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private IntegrationService integrationService;

    @Mock
    private GoogleSheetsService googleSheetsService;

    @Mock
    private ExcelExportService excelExportService;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private IntegrationController integrationController;

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
        mockMvc = MockMvcBuilders.standaloneSetup(integrationController)
                .setCustomArgumentResolvers(authResolver)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/integrations - Should return list of integrations")
    void getIntegrations_Success() throws Exception {
        IntegrationResponse response = mock(IntegrationResponse.class);
        when(response.name()).thenReturn("Webhook Sync");
        when(integrationService.getIntegrations(1L)).thenReturn(List.of(response));

        mockMvc.perform(get("/api/v1/integrations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Webhook Sync"));
    }

    @Test
    @DisplayName("POST /api/v1/integrations - Should create integration and return 201 Created")
    void createIntegration_Success() throws Exception {
        IntegrationCreateRequest request = new IntegrationCreateRequest("Webhook Sync", IntegrationType.WEBHOOK, 10L, Map.of("url", "https://webhook.site/abc"));
        IntegrationResponse response = mock(IntegrationResponse.class);
        when(response.name()).thenReturn("Webhook Sync");
        when(integrationService.createIntegration(any(IntegrationCreateRequest.class), eq(1L))).thenReturn(response);

        mockMvc.perform(post("/api/v1/integrations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Webhook Sync"));
    }

    @Test
    @DisplayName("POST /api/v1/integrations - Should return 400 Bad Request when name is blank")
    void createIntegration_BlankName_ReturnsBadRequest() throws Exception {
        IntegrationCreateRequest request = new IntegrationCreateRequest("", IntegrationType.WEBHOOK, 10L, Map.of());

        mockMvc.perform(post("/api/v1/integrations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("DELETE /api/v1/integrations/{id} - Should delete integration and return 204 No Content")
    void deleteIntegration_Success() throws Exception {
        mockMvc.perform(delete("/api/v1/integrations/5"))
                .andExpect(status().isNoContent());

        verify(integrationService, times(1)).deleteIntegration(5L, 1L);
    }
}
