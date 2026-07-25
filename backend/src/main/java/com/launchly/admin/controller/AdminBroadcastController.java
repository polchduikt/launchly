package com.launchly.admin.controller;

import com.launchly.admin.dto.AdminBroadcastDetailDto;
import com.launchly.admin.dto.AdminBroadcastDto;
import com.launchly.admin.dto.AdminBlockRequest;
import com.launchly.admin.service.AdminBroadcastService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/broadcasts")
@RequiredArgsConstructor
public class AdminBroadcastController {

    private final AdminBroadcastService adminBroadcastService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Page<AdminBroadcastDto>> getBroadcasts(
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false, defaultValue = "all") String status,
            @RequestParam(defaultValue = "desc") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminBroadcastService.getBroadcasts(search, status, sort, page, size));
    }

    @GetMapping("/{broadcastId}/details")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<AdminBroadcastDetailDto> getBroadcastDetails(
            @PathVariable Long broadcastId,
            @RequestParam(defaultValue = "all") String period,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminBroadcastService.getBroadcastDetails(broadcastId, period, page, size));
    }

    @PostMapping("/{broadcastId}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> cancelBroadcast(@PathVariable Long broadcastId) {
        adminBroadcastService.cancelBroadcast(broadcastId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{broadcastId}/block")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> blockBroadcast(
            @PathVariable Long broadcastId,
            @RequestBody(required = false) AdminBlockRequest request) {
        adminBroadcastService.blockBroadcast(broadcastId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{broadcastId}/unblock")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> unblockBroadcast(@PathVariable Long broadcastId) {
        adminBroadcastService.unblockBroadcast(broadcastId);
        return ResponseEntity.ok().build();
    }
}
