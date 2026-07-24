package com.launchly.admin.service;

import com.launchly.admin.dto.AdminAutomationDetailDto;
import com.launchly.admin.dto.AdminAutomationDto;
import org.springframework.data.domain.Page;

public interface AdminAutomationService {
    Page<AdminAutomationDto> getAutomations(String search, String status, int page, int size);
    AdminAutomationDetailDto getAutomationDetails(Long automationId, String period, int page, int size);
    void toggleAutomation(Long automationId);
    void blockAutomation(Long automationId, String reason);
    void unblockAutomation(Long automationId);
}
