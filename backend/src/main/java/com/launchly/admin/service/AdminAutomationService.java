package com.launchly.admin.service;

import com.launchly.admin.dto.AdminAutomationDto;
import java.util.List;

public interface AdminAutomationService {
    List<AdminAutomationDto> getAutomations();
    void toggleAutomation(Long automationId);
}
