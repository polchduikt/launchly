package com.launchly.admin.controller;

import com.launchly.admin.dto.AdminStatsDto;
import com.launchly.admin.service.AdminStatsService;
import com.launchly.common.exception.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.time.LocalDateTime;

@Tag(name = "Admin: Analytics & Stats", description = "Platform-wide metrics, MRR, active users, bots, broadcasts, and growth analytics")
@RestController
@RequestMapping("/api/v1/admin/stats")
@RequiredArgsConstructor
public class AdminStatsController {

    private final AdminStatsService adminStatsService;

    @Operation(summary = "Get platform statistics and analytics", description = "Retrieve aggregated platform metrics including users, bots, MRR, conversion rates, and activity over selected time periods.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved platform statistics"),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN or MANAGER role", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<AdminStatsDto> getStats(
            @Parameter(description = "Optional search query filter") @RequestParam(required = false) String search,
            @Parameter(description = "Time period preset: all, today, 7d, 30d, 90d, 12m") @RequestParam(required = false) String period,
            @Parameter(description = "Custom start date time (ISO format)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @Parameter(description = "Custom end date time (ISO format)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return ResponseEntity.ok(adminStatsService.getStats(search, period, startDate, endDate));
    }
}

