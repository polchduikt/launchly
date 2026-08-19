package com.launchly.auth.controller;

import com.launchly.auth.dto.response.TelegramSessionResponse;
import com.launchly.auth.dto.response.TelegramStatusResponse;
import com.launchly.auth.entity.AuthSessionStatus;
import com.launchly.auth.service.AuthService;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class TelegramAuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuthService authService;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private TelegramAuthController telegramAuthController;

    @BeforeEach
    void setUp() {
        GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler(messageUtils);
        mockMvc = MockMvcBuilders.standaloneSetup(telegramAuthController)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/auth/telegram/session - Should create session and return 200 OK")
    void createSession_Success() throws Exception {
        TelegramSessionResponse mockResponse = new TelegramSessionResponse("tok_123", "launchly_bot");
        when(authService.createTelegramSession(any(), anyBoolean())).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/auth/telegram/session"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("tok_123"))
                .andExpect(jsonPath("$.botUsername").value("launchly_bot"));
    }

    @Test
    @DisplayName("GET /api/v1/auth/telegram/status/{token} - Should return session status 200 OK")
    void getStatus_Found_ReturnsOk() throws Exception {
        TelegramStatusResponse mockResponse = new TelegramStatusResponse(AuthSessionStatus.PENDING, null, null, null);
        when(authService.checkTelegramSessionStatus("tok_123")).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/auth/telegram/status/tok_123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @DisplayName("GET /api/v1/auth/telegram/status/{token} - Should return 404 Not Found when token invalid")
    void getStatus_NotFound_ReturnsNotFound() throws Exception {
        when(authService.checkTelegramSessionStatus("invalid_tok"))
                .thenThrow(new AppException(HttpStatus.NOT_FOUND, "auth.error.session_not_found"));

        mockMvc.perform(get("/api/v1/auth/telegram/status/invalid_tok"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/v1/auth/telegram/unlink - Should unlink telegram and return 204 No Content")
    void unlinkTelegram_Success() throws Exception {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("user@launchly.pro", null, Collections.emptyList());

        mockMvc.perform(post("/api/v1/auth/telegram/unlink").principal(auth))
                .andExpect(status().isNoContent());

        verify(authService, times(1)).unlinkTelegram("user@launchly.pro");
    }
}
