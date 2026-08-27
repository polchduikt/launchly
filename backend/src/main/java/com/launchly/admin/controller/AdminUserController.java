package com.launchly.admin.controller;

import com.launchly.admin.dto.AdminBlockRequest;
import com.launchly.admin.dto.AdminUserDetailDto;
import com.launchly.admin.dto.AdminUserDto;
import com.launchly.admin.dto.UpdateUserRoleRequest;
import com.launchly.admin.service.AdminUserService;
import com.launchly.auth.entity.Role;
import com.launchly.common.exception.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Admin: Users", description = "User management, role assignment, status toggling, and activity inspection")
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @Operation(summary = "Get paginated users list", description = "Retrieve a paginated list of users with optional filtering by search term, role, plan, and sorting.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved users page"),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN or MANAGER role", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Page<AdminUserDto>> getUsers(
            @Parameter(description = "Search term by email or name") @RequestParam(required = false) String search,
            @Parameter(description = "Filter by user role") @RequestParam(required = false) Role role,
            @Parameter(description = "Filter by subscription plan name") @RequestParam(required = false) String plan,
            @Parameter(description = "Sort direction: asc or desc") @RequestParam(defaultValue = "desc") String sort,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "30") int size) {
        return ResponseEntity.ok(adminUserService.getUsers(search, role, plan, sort, page, size));
    }

    @Operation(summary = "Update user role", description = "Assign a new role (e.g. ROLE_USER, ROLE_ADMIN, ROLE_MANAGER) to a specific user.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Role successfully updated"),
            @ApiResponse(responseCode = "400", description = "Invalid role or cannot change own role", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "User not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN role", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PatchMapping("/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminUserDto> updateUserRole(
            @Parameter(description = "Target user ID") @PathVariable Long userId,
            @Valid @RequestBody UpdateUserRoleRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(adminUserService.updateUserRole(userId, request.getRole(), userDetails.getUsername()));
    }

    @Operation(summary = "Toggle user status / block user", description = "Block or unblock a user account with optional reason and block details.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User status toggled successfully"),
            @ApiResponse(responseCode = "404", description = "User not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN role", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PatchMapping("/{userId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminUserDto> toggleUserStatus(
            @Parameter(description = "Target user ID") @PathVariable Long userId,
            @RequestBody(required = false) AdminBlockRequest request) {
        return ResponseEntity.ok(adminUserService.toggleUserStatus(userId, request));
    }

    @Operation(summary = "Get user full details", description = "Get detailed user overview including automations, broadcasts, statistics, and audit activity logs.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User details retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "User not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN or MANAGER role", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<AdminUserDetailDto> getUserDetails(
            @Parameter(description = "Target user ID") @PathVariable Long userId,
            @Parameter(description = "Time period filter: all, today, 7d, 30d") @RequestParam(defaultValue = "all") String period,
            @Parameter(description = "Activity category filter: all, auth, bot, broadcast, billing, system") @RequestParam(defaultValue = "all") String category,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminUserService.getUserDetails(userId, period, category, page, size));
    }
}

