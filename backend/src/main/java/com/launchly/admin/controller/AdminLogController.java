package com.launchly.admin.controller;

import com.launchly.admin.dto.AdminLogDto;
import com.launchly.admin.service.AdminLogService;
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

@Tag(name = "Admin: System Logs", description = "System logging, application events, and audit logs search")
@RestController
@RequestMapping("/api/v1/admin/logs")
@RequiredArgsConstructor
public class AdminLogController {

    private final AdminLogService adminLogService;

    @Operation(summary = "Get system logs", description = "Retrieve a paginated list of system logs with level, service, search term, date range, and sorting filters.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved logs"),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN role", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AdminLogDto>> getLogs(
            @Parameter(description = "Log level filter: all, info, warn, error, debug") @RequestParam(required = false) String level,
            @Parameter(description = "Service name filter: all, bot, auth, broadcast, integration, billing") @RequestParam(required = false) String service,
            @Parameter(description = "Search term in log message") @RequestParam(required = false) String search,
            @Parameter(description = "Start date time filter") @RequestParam(required = false) String startDate,
            @Parameter(description = "End date time filter") @RequestParam(required = false) String endDate,
            @Parameter(description = "Sort direction: asc or desc") @RequestParam(defaultValue = "desc") String sort,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "100") int size) {
        return ResponseEntity.ok(adminLogService.getSystemLogs(level, service, search, startDate, endDate, sort, page, size));
    }
}

