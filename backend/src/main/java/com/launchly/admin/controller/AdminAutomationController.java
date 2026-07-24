package com.launchly.admin.controller;

import com.launchly.admin.dto.AdminAutomationDetailDto;
import com.launchly.admin.dto.AdminAutomationDto;
import com.launchly.admin.service.AdminAutomationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/automations")
@RequiredArgsConstructor
public class AdminAutomationController {

    private final AdminAutomationService adminAutomationService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Page<AdminAutomationDto>> getAutomations(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size
    ) {
        return ResponseEntity.ok(adminAutomationService.getAutomations(search, status, page, size));
    }

    @GetMapping("/{automationId}/details")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<AdminAutomationDetailDto> getAutomationDetails(
            @PathVariable Long automationId,
            @RequestParam(defaultValue = "all") String period,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(adminAutomationService.getAutomationDetails(automationId, period, page, size));
    }

    @PostMapping("/{automationId}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> toggleAutomation(@PathVariable Long automationId) {
        adminAutomationService.toggleAutomation(automationId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{automationId}/block")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> blockAutomation(
            @PathVariable Long automationId,
            @RequestBody(required = false) java.util.Map<String, String> payload
    ) {
        String reason = payload != null ? payload.get("reason") : "Administrative Block";
        adminAutomationService.blockAutomation(automationId, reason);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{automationId}/unblock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> unblockAutomation(@PathVariable Long automationId) {
        adminAutomationService.unblockAutomation(automationId);
        return ResponseEntity.ok().build();
    }
}
