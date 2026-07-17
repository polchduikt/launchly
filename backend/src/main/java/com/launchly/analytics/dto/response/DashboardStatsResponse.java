package com.launchly.analytics.dto.response;

import java.util.List;

public record DashboardStatsResponse(
    long totalSubscribers,
    long activeUsers24h,
    long clicksCount30d,
    long activeAutomations,
    List<DailyStatsEntry> dailyStats,
    List<ButtonStatsEntry> topButtons,
    long aiMessagesProcessed,
    int aiResolutionRate,
    long aiTimeSavedHours,
    double aiResponseTimeSeconds,
    List<TagStatsEntry> topTags,
    List<HeatmapEntry> activityHeatmap
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

    public record TagStatsEntry(
        String tagName,
        long count
    ) {}

    public record HeatmapEntry(
        int dayOfWeek,
        int hour,
        long count
    ) {}
}
