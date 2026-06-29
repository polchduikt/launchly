package com.launchly.analytics.dto.response;

import java.util.List;

public record DashboardStatsResponse(
    long totalSubscribers,
    long activeUsers24h,
    long clicksCount30d,
    long activeAutomations,
    List<DailyStatsEntry> dailyStats,
    List<ButtonStatsEntry> topButtons
) {
    public record DailyStatsEntry(
        String date,
        long activeUsers,
        long clicks
    ) {}

    public record ButtonStatsEntry(
        String buttonName,
        long clicks
    ) {}
}
