package com.launchly.support.controller;

import com.launchly.common.exception.GlobalExceptionHandler;
import com.launchly.common.utils.MessageUtils;
import com.launchly.support.dto.SupportAppealRequest;
import com.launchly.support.service.SupportAppealService;
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
import tools.jackson.databind.ObjectMapper;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class SupportAppealControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private SupportAppealService supportAppealService;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private SupportAppealController appealController;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler(messageUtils);
        mockMvc = MockMvcBuilders.standaloneSetup(appealController)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/support/appeal - Should submit support appeal")
    void submitAppeal_Success() throws Exception {
        SupportAppealRequest request = new SupportAppealRequest("Help needed", "client@example.com", "John");
        when(messageUtils.getMessage("support.appeal.success")).thenReturn("Appeal submitted successfully");

        mockMvc.perform(post("/api/v1/support/appeal")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("success"));
    }

    @Test
    @DisplayName("POST /api/v1/support/appeal - Should return 400 Bad Request when message is blank")
    void submitAppeal_BlankMessage_ReturnsBadRequest() throws Exception {
        SupportAppealRequest request = new SupportAppealRequest("", "client@example.com", "John");

        mockMvc.perform(post("/api/v1/support/appeal")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
