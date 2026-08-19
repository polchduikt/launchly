package com.launchly.notification.controller;

import com.launchly.auth.dto.response.UserResponse;
import com.launchly.common.exception.GlobalExceptionHandler;
import com.launchly.common.utils.MessageUtils;
import com.launchly.notification.dto.UpdateNotificationSettingsRequest;
import com.launchly.notification.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import tools.jackson.databind.ObjectMapper;

import java.util.Collections;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private NotificationService notificationService;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private NotificationController notificationController;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler(messageUtils);
        mockMvc = MockMvcBuilders.standaloneSetup(notificationController)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("PUT /api/v1/notifications/settings - Should update settings")
    void updateSettings_Success() throws Exception {
        UpdateNotificationSettingsRequest request = new UpdateNotificationSettingsRequest(true, false, "alerts@launchly.pro", false, "09:00", 1, 1, false, false);
        UserResponse response = mock(UserResponse.class);
        when(notificationService.updateSettings(eq("user@launchly.pro"), any(UpdateNotificationSettingsRequest.class))).thenReturn(response);

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("user@launchly.pro", null, Collections.emptyList());

        mockMvc.perform(put("/api/v1/notifications/settings")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/v1/notifications/telegram/unlink - Should unlink telegram notifications")
    void unlinkTelegram_Success() throws Exception {
        UserResponse response = mock(UserResponse.class);
        when(notificationService.unlinkTelegram("user@launchly.pro")).thenReturn(response);

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("user@launchly.pro", null, Collections.emptyList());

        mockMvc.perform(post("/api/v1/notifications/telegram/unlink").principal(auth))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PUT /api/v1/notifications/timezone - Should update timezone")
    void updateTimezone_Success() throws Exception {
        UserResponse response = mock(UserResponse.class);
        when(notificationService.updateTimezone("user@launchly.pro", "Europe/Kyiv")).thenReturn(response);

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("user@launchly.pro", null, Collections.emptyList());

        mockMvc.perform(put("/api/v1/notifications/timezone")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("timezone", "Europe/Kyiv"))))
                .andExpect(status().isOk());
    }
}
