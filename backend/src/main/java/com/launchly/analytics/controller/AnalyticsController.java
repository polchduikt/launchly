package com.launchly.analytics.controller;

import com.launchly.analytics.dto.response.DashboardStatsResponse;
import com.launchly.analytics.service.AnalyticsService;
import com.launchly.common.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/bots/{botId}/dashboard")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats(
            @PathVariable Long botId,
            @RequestParam(defaultValue = "7") int days,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(analyticsService.getDashboardStats(botId, days, userDetails.getId()));
    }
}
