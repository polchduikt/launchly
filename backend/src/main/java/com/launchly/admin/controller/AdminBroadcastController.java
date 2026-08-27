package com.launchly.admin.controller;

import com.launchly.admin.dto.AdminBlockRequest;
import com.launchly.admin.dto.AdminBroadcastDetailDto;
import com.launchly.admin.dto.AdminBroadcastDto;
import com.launchly.admin.service.AdminBroadcastService;
import com.launchly.common.exception.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Admin: Broadcasts", description = "Administration, moderation, cancellation, and blocking of broadcast campaigns")
@RestController
@RequestMapping("/api/v1/admin/broadcasts")
@RequiredArgsConstructor
public class AdminBroadcastController {

    private final AdminBroadcastService adminBroadcastService;

    @Operation(summary = "Get broadcasts list", description = "Retrieve a paginated list of broadcast campaigns with search, status filters, and sorting.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved broadcasts list"),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN or MANAGER role", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Page<AdminBroadcastDto>> getBroadcasts(
            @Parameter(description = "Search term by campaign name or bot name") @RequestParam(required = false, defaultValue = "") String search,
            @Parameter(description = "Status filter: all, draft, scheduled, in_progress, completed, failed, blocked") @RequestParam(required = false, defaultValue = "all") String status,
            @Parameter(description = "Sort direction: asc or desc") @RequestParam(defaultValue = "desc") String sort,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminBroadcastService.getBroadcasts(search, status, sort, page, size));
    }

    @Operation(summary = "Get broadcast details", description = "Retrieve detailed information about a specific broadcast campaign, target audience, progress, and logs.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Broadcast details retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Broadcast campaign not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN or MANAGER role", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{broadcastId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<AdminBroadcastDetailDto> getBroadcastDetails(
            @Parameter(description = "Broadcast campaign ID") @PathVariable Long broadcastId,
            @Parameter(description = "Time period filter: all, today, 7d, 30d") @RequestParam(defaultValue = "all") String period,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminBroadcastService.getBroadcastDetails(broadcastId, period, page, size));
    }

    @Operation(summary = "Cancel scheduled broadcast", description = "Cancel a scheduled or active broadcast campaign.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Broadcast cancelled successfully"),
            @ApiResponse(responseCode = "404", description = "Broadcast not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN or MANAGER role", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{broadcastId}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> cancelBroadcast(@Parameter(description = "Broadcast ID") @PathVariable Long broadcastId) {
        adminBroadcastService.cancelBroadcast(broadcastId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Block broadcast campaign", description = "Block a broadcast campaign by administrator.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Broadcast blocked successfully"),
            @ApiResponse(responseCode = "404", description = "Broadcast not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN or MANAGER role", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{broadcastId}/block")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> blockBroadcast(
            @Parameter(description = "Broadcast ID") @PathVariable Long broadcastId,
            @RequestBody(required = false) AdminBlockRequest request) {
        adminBroadcastService.blockBroadcast(broadcastId, request);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Unblock broadcast campaign", description = "Remove administrator block from a broadcast campaign.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Broadcast unblocked successfully"),
            @ApiResponse(responseCode = "404", description = "Broadcast not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN or MANAGER role", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{broadcastId}/unblock")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> unblockBroadcast(@Parameter(description = "Broadcast ID") @PathVariable Long broadcastId) {
        adminBroadcastService.unblockBroadcast(broadcastId);
        return ResponseEntity.ok().build();
    }
}

