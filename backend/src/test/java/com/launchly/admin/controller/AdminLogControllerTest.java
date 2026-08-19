package com.launchly.admin.controller;

import com.launchly.admin.dto.AdminLogDto;
import com.launchly.admin.service.AdminLogService;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminLogControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AdminLogService adminLogService;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private AdminLogController adminLogController;

    @BeforeEach
    void setUp() {
        GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler(messageUtils);
        mockMvc = MockMvcBuilders.standaloneSetup(adminLogController)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/admin/logs - Should return system logs")
    void getLogs_Success() throws Exception {
        Page<AdminLogDto> page = new PageImpl<>(List.of(new AdminLogDto()), PageRequest.of(0, 100), 1);
        when(adminLogService.getSystemLogs(any(), any(), any(), any(), any(), eq("desc"), eq(0), eq(100))).thenReturn(page);

        mockMvc.perform(get("/api/v1/admin/logs"))
                .andExpect(status().isOk());
    }
}
