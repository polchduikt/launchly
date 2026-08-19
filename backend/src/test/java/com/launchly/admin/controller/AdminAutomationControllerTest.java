package com.launchly.admin.controller;

import com.launchly.admin.dto.AdminAutomationDetailDto;
import com.launchly.admin.dto.AdminAutomationDto;
import com.launchly.admin.dto.AdminBlockRequest;
import com.launchly.admin.service.AdminAutomationService;
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
class AdminAutomationControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AdminAutomationService adminAutomationService;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private AdminAutomationController adminAutomationController;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler(messageUtils);
        mockMvc = MockMvcBuilders.standaloneSetup(adminAutomationController)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/admin/automations - Should return automations page")
    void getAutomations_Success() throws Exception {
        Page<AdminAutomationDto> page = new PageImpl<>(List.of(new AdminAutomationDto()), PageRequest.of(0, 30), 1);
        when(adminAutomationService.getAutomations(any(), any(), eq("desc"), eq(0), eq(30))).thenReturn(page);

        mockMvc.perform(get("/api/v1/admin/automations"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/v1/admin/automations/{automationId}/details - Should return automation details")
    void getAutomationDetails_Success() throws Exception {
        AdminAutomationDetailDto dto = new AdminAutomationDetailDto();
        when(adminAutomationService.getAutomationDetails(eq(10L), eq("all"), eq(0), eq(20))).thenReturn(dto);

        mockMvc.perform(get("/api/v1/admin/automations/10/details"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/v1/admin/automations/{automationId}/block - Should block automation")
    void blockAutomation_Success() throws Exception {
        AdminBlockRequest request = new AdminBlockRequest("Malicious schema", "details");

        mockMvc.perform(post("/api/v1/admin/automations/10/block")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(adminAutomationService, times(1)).blockAutomation(eq(10L), any(AdminBlockRequest.class));
    }
}
