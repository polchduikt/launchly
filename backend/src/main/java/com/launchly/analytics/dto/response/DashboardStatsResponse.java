package com.launchly.analytics.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Aggregated dashboard analytics for a Telegram bot")
public record DashboardStatsResponse(
    @Schema(description = "Total lifetime subscribers count", example = "1250")
    long totalSubscribers,

    @Schema(description = "Active subscribers in the last 24 hours", example = "184")
    long activeUsers24h,

    @Schema(description = "Total button clicks over past 30 days", example = "4200")
    long clicksCount30d,

    @Schema(description = "Number of currently active automation flows", example = "6")
    long activeAutomations,

    @Schema(description = "Daily timeline of active users and interactions")
    List<DailyStatsEntry> dailyStats,

    @Schema(description = "Most frequently clicked buttons in the bot")
    List<ButtonStatsEntry> topButtons,

    @Schema(description = "Total messages handled by AI assistant", example = "850")
    long aiMessagesProcessed,

    @Schema(description = "AI autonomous resolution rate percentage (0-100%)", example = "92")
    int aiResolutionRate,

    @Schema(description = "Estimated support agent time saved in hours", example = "45")
    long aiTimeSavedHours,

    @Schema(description = "Average AI response latency in seconds", example = "1.2")
    double aiResponseTimeSeconds,

    @Schema(description = "Most common tags assigned to subscribers")
    List<TagStatsEntry> topTags,

    @Schema(description = "Subscriber activity heatmap by day of week and hour of day")
    List<HeatmapEntry> activityHeatmap,

    @Schema(description = "Subscribers percentage growth vs previous period", example = "14.5")
    double subscribersGrowth,

    @Schema(description = "Active users percentage growth", example = "8.2")
    double activeUsersGrowth,

    @Schema(description = "Button clicks percentage growth", example = "22.1")
    double clicksGrowth,

    @Schema(description = "Automations growth percentage", example = "0.0")
    double automationsGrowth
) {
    @Schema(description = "Single day analytics data point")
    public record DailyStatsEntry(
        @Schema(description = "Date string (yyyy-MM-dd)", example = "2026-08-19")
        String date,

        @Schema(description = "Active users count", example = "120")
        long activeUsers,

        @Schema(description = "Total clicks count", example = "450")
        long clicks
    ) {}

    @Schema(description = "Button click ranking entry")
    public record ButtonStatsEntry(
        @Schema(description = "Button label / identifier", example = "🛒 Оформити замовлення")
        String buttonName,

        @Schema(description = "Number of clicks", example = "890")
        long clicks
    ) {}

    @Schema(description = "Subscriber tag popularity entry")
    public record TagStatsEntry(
        @Schema(description = "Tag name", example = "VIP")
        String tagName,

        @Schema(description = "Subscribers tagged count", example = "310")
        long count
    ) {}

    @Schema(description = "Activity heatmap point")
    public record HeatmapEntry(
        @Schema(description = "Day of week (1=Monday .. 7=Sunday)", example = "3")
        int dayOfWeek,

        @Schema(description = "Hour of day (0..23)", example = "14")
        int hour,

        @Schema(description = "Interaction count during this time window", example = "78")
        long count
    ) {}
}

