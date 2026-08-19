package com.launchly.analytics.controller;

import com.launchly.analytics.dto.response.DashboardStatsResponse;
import com.launchly.analytics.service.AnalyticsService;
import com.launchly.common.exception.ErrorResponse;
import com.launchly.common.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Analytics: Bot Dashboard & Metrics", description = "Subscriber engagement analytics, button clicks, AI performance, and activity heatmaps")
@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @Operation(summary = "Get bot dashboard analytics", description = "Retrieve aggregated performance metrics for a specific bot over the selected time range (default 7 days).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Bot dashboard statistics"),
            @ApiResponse(responseCode = "400", description = "Invalid bot ID or period", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Bot not found or access denied", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/bots/{botId}/dashboard")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats(
            @Parameter(description = "Target Bot ID") @PathVariable Long botId,
            @Parameter(description = "Time period in days (e.g. 7, 14, 30)") @RequestParam(defaultValue = "7") int days,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(analyticsService.getDashboardStats(botId, days, userDetails.getId()));
    }
}

