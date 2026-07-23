package com.launchly.admin.controller;

import com.launchly.admin.dto.AdminUserDto;
import com.launchly.admin.dto.UpdateUserRoleRequest;
import com.launchly.admin.service.AdminUserService;
import com.launchly.auth.entity.Role;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Page<AdminUserDto>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Role role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(adminUserService.getUsers(search, role, page, size));
    }

    @PatchMapping("/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminUserDto> updateUserRole(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserRoleRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(adminUserService.updateUserRole(userId, request.getRole(), userDetails.getUsername()));
    }

    @PatchMapping("/{userId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminUserDto> toggleUserStatus(
            @PathVariable Long userId,
            @RequestBody(required = false) com.launchly.admin.dto.BlockUserRequest request
    ) {
        String reason = request != null ? request.getReason() : null;
        String details = request != null ? request.getDetails() : null;
        return ResponseEntity.ok(adminUserService.toggleUserStatus(userId, reason, details));
    }

    @GetMapping("/{userId}/details")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<com.launchly.admin.dto.AdminUserDetailDto> getUserDetails(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "all") String period,
            @RequestParam(defaultValue = "all") String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(adminUserService.getUserDetails(userId, period, category, page, size));
    }
}
