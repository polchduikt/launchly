package com.launchly.bot.controller;

import com.launchly.bot.dto.request.CreateTemplateRequest;
import com.launchly.bot.dto.request.UpdateTemplateRequest;
import com.launchly.bot.dto.response.TemplateResponse;
import com.launchly.bot.service.TemplateService;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class TemplateControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private TemplateService templateService;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private TemplateController templateController;

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
        mockMvc = MockMvcBuilders.standaloneSetup(templateController)
                .setCustomArgumentResolvers(authResolver)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/templates/create - Should create template and return 201 Created")
    void createTemplate_Success() throws Exception {
        CreateTemplateRequest request = mock(CreateTemplateRequest.class);
        TemplateResponse response = mock(TemplateResponse.class);
        when(response.shareCode()).thenReturn("tpl_abc");
        when(templateService.createTemplate(any(CreateTemplateRequest.class), eq(1L))).thenReturn(response);

        mockMvc.perform(post("/api/v1/templates/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.shareCode").value("tpl_abc"));
    }

    @Test
    @DisplayName("GET /api/v1/templates/my - Should return user templates list")
    void getMyTemplates_Success() throws Exception {
        TemplateResponse response = mock(TemplateResponse.class);
        when(response.shareCode()).thenReturn("tpl_abc");
        when(templateService.getMyTemplates(1L)).thenReturn(List.of(response));

        mockMvc.perform(get("/api/v1/templates/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].shareCode").value("tpl_abc"));
    }

    @Test
    @DisplayName("GET /api/v1/templates/share/{shareCode} - Should return template by share code")
    void getTemplateByShareCode_Success() throws Exception {
        TemplateResponse response = mock(TemplateResponse.class);
        when(response.shareCode()).thenReturn("tpl_abc");
        when(templateService.getTemplateByShareCode("tpl_abc")).thenReturn(response);

        mockMvc.perform(get("/api/v1/templates/share/tpl_abc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shareCode").value("tpl_abc"));
    }

    @Test
    @DisplayName("GET /api/v1/templates/share/{shareCode} - Should return 404 Not Found when code invalid")
    void getTemplateByShareCode_NotFound() throws Exception {
        when(templateService.getTemplateByShareCode("unknown"))
                .thenThrow(new AppException(HttpStatus.NOT_FOUND, "template.error.not_found"));

        mockMvc.perform(get("/api/v1/templates/share/unknown"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/v1/templates/install/{shareCode} - Should install template and return 200 OK")
    void installTemplate_Success() throws Exception {
        mockMvc.perform(post("/api/v1/templates/install/tpl_abc").param("botId", "10"))
                .andExpect(status().isOk());

        verify(templateService, times(1)).installTemplate("tpl_abc", 10L, 1L);
    }

    @Test
    @DisplayName("DELETE /api/v1/templates/{shareCode} - Should delete template and return 204 No Content")
    void deleteTemplate_Success() throws Exception {
        mockMvc.perform(delete("/api/v1/templates/tpl_abc"))
                .andExpect(status().isNoContent());

        verify(templateService, times(1)).deleteTemplate("tpl_abc", 1L);
    }
}
