package com.launchly.admin.controller;

import com.launchly.admin.dto.AdminBroadcastDto;
import com.launchly.admin.dto.CreateBroadcastRequest;
import com.launchly.admin.service.AdminBroadcastService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/broadcasts")
@RequiredArgsConstructor
public class AdminBroadcastController {

    private final AdminBroadcastService adminBroadcastService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<AdminBroadcastDto>> getBroadcasts() {
        return ResponseEntity.ok(adminBroadcastService.getBroadcasts());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<AdminBroadcastDto> createBroadcast(
            @Valid @RequestBody CreateBroadcastRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(adminBroadcastService.createBroadcast(request, userDetails.getUsername()));
    }
}
