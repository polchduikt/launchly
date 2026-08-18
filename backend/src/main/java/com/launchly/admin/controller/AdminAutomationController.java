package com.launchly.admin.controller;

import com.launchly.admin.dto.AdminAutomationDetailDto;
import com.launchly.admin.dto.AdminAutomationDto;
import com.launchly.admin.dto.AdminBlockRequest;
import com.launchly.admin.service.AdminAutomationService;
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

@Tag(name = "Admin: Automations", description = "Administration, moderation, toggling, and blocking of automation flow schemas")
@RestController
@RequestMapping("/api/v1/admin/automations")
@RequiredArgsConstructor
public class AdminAutomationController {

    private final AdminAutomationService adminAutomationService;

    @Operation(summary = "Get automations list", description = "Retrieve a paginated list of automations with search, status filters, and sorting.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved automations"),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN or MANAGER role", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Page<AdminAutomationDto>> getAutomations(
            @Parameter(description = "Search term by flow name or bot name") @RequestParam(required = false) String search,
            @Parameter(description = "Status filter: all, active, inactive, blocked") @RequestParam(required = false) String status,
            @Parameter(description = "Sort direction: asc or desc") @RequestParam(defaultValue = "desc") String sort,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "30") int size) {
        return ResponseEntity.ok(adminAutomationService.getAutomations(search, status, sort, page, size));
    }

    @Operation(summary = "Get automation details", description = "Retrieve detailed information about a specific automation flow schema, connected bots, executions, and logs.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Automation details retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Automation flow not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN or MANAGER role", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{automationId}/details")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<AdminAutomationDetailDto> getAutomationDetails(
            @Parameter(description = "Automation schema ID") @PathVariable Long automationId,
            @Parameter(description = "Time period filter: all, today, 7d, 30d") @RequestParam(defaultValue = "all") String period,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminAutomationService.getAutomationDetails(automationId, period, page, size));
    }

    @Operation(summary = "Toggle automation active state", description = "Activate or deactivate an automation flow.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Automation state toggled successfully"),
            @ApiResponse(responseCode = "404", description = "Automation not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN role", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{automationId}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> toggleAutomation(@Parameter(description = "Automation ID") @PathVariable Long automationId) {
        adminAutomationService.toggleAutomation(automationId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Block automation flow", description = "Block an automation flow by administrator, preventing further executions.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Automation blocked successfully"),
            @ApiResponse(responseCode = "404", description = "Automation not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN role", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{automationId}/block")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> blockAutomation(
            @Parameter(description = "Automation ID") @PathVariable Long automationId,
            @RequestBody(required = false) AdminBlockRequest request) {
        adminAutomationService.blockAutomation(automationId, request);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Unblock automation flow", description = "Remove administrator block from an automation flow.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Automation unblocked successfully"),
            @ApiResponse(responseCode = "404", description = "Automation not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN role", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{automationId}/unblock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> unblockAutomation(@Parameter(description = "Automation ID") @PathVariable Long automationId) {
        adminAutomationService.unblockAutomation(automationId);
        return ResponseEntity.ok().build();
    }
}

