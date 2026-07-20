package com.launchly.admin.controller;

import com.launchly.admin.dto.AdminAutomationDto;
import com.launchly.admin.service.AdminAutomationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/automations")
@RequiredArgsConstructor
public class AdminAutomationController {

    private final AdminAutomationService adminAutomationService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<AdminAutomationDto>> getAutomations() {
        return ResponseEntity.ok(adminAutomationService.getAutomations());
    }

    @PostMapping("/{automationId}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> toggleAutomation(@PathVariable Long automationId) {
        adminAutomationService.toggleAutomation(automationId);
        return ResponseEntity.ok().build();
    }
}
