package com.launchly.common.controller;

import com.launchly.common.exception.GlobalExceptionHandler;
import com.launchly.common.service.I18nService;
import com.launchly.common.utils.MessageUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class I18nControllerTest {

    private MockMvc mockMvc;

    @Mock
    private I18nService i18nService;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private I18nController i18nController;

    @BeforeEach
    void setUp() {
        GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler(messageUtils);
        mockMvc = MockMvcBuilders.standaloneSetup(i18nController)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("GET /api/i18n/translations - Should return translations map")
    void getTranslations_Success() throws Exception {
        when(i18nService.getTranslations("uk")).thenReturn(Map.of("app.title", "Launchly"));

        mockMvc.perform(get("/api/i18n/translations").param("lang", "uk"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.['app.title']").value("Launchly"));
    }
}
