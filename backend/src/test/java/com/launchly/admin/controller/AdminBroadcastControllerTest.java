package com.launchly.admin.controller;

import com.launchly.admin.dto.AdminBlockRequest;
import com.launchly.admin.dto.AdminBroadcastDetailDto;
import com.launchly.admin.dto.AdminBroadcastDto;
import com.launchly.admin.service.AdminBroadcastService;
import com.launchly.common.exception.GlobalExceptionHandler;
import com.launchly.common.utils.MessageUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminBroadcastControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AdminBroadcastService adminBroadcastService;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private AdminBroadcastController adminBroadcastController;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler(messageUtils);
        mockMvc = MockMvcBuilders.standaloneSetup(adminBroadcastController)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/admin/broadcasts - Should return broadcasts page")
    void getBroadcasts_Success() throws Exception {
        Page<AdminBroadcastDto> page = new PageImpl<>(List.of(new AdminBroadcastDto()), PageRequest.of(0, 10), 1);
        when(adminBroadcastService.getBroadcasts(eq(""), eq("all"), eq("desc"), eq(0), eq(10))).thenReturn(page);

        mockMvc.perform(get("/api/v1/admin/broadcasts"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/v1/admin/broadcasts/{broadcastId} - Should return broadcast details")
    void getBroadcastDetails_Success() throws Exception {
        AdminBroadcastDetailDto dto = new AdminBroadcastDetailDto();
        when(adminBroadcastService.getBroadcastDetails(eq(15L), eq("all"), eq(0), eq(10))).thenReturn(dto);

        mockMvc.perform(get("/api/v1/admin/broadcasts/15"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/v1/admin/broadcasts/{broadcastId}/block - Should block broadcast")
    void blockBroadcast_Success() throws Exception {
        AdminBlockRequest request = new AdminBlockRequest("Spam detected", "details");

        mockMvc.perform(post("/api/v1/admin/broadcasts/15/block")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(adminBroadcastService, times(1)).blockBroadcast(eq(15L), any(AdminBlockRequest.class));
    }
}
