package com.launchly.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Schema(description = "Platform-wide administrative statistics, financial metrics, and server health overview")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsDto {
    @Schema(description = "Total registered platform users", example = "1240")
    private long totalUsers;

    @Schema(description = "Total bot owners count", example = "450")
    private long totalOwners;

    @Schema(description = "Total owners percentage change vs previous period", example = "+12.5%")
    private String totalOwnersChange;

    @Schema(description = "Active bot owners", example = "310")
    private long activeOwners;

    @Schema(description = "Active owners percentage change", example = "+8.2%")
    private String activeOwnersChange;

    @Schema(description = "Total end-user subscribers across all bots", example = "95400")
    private long totalBotUsers;

    @Schema(description = "Total bot users change", example = "+15.4%")
    private String totalBotUsersChange;

    @Schema(description = "Number of active running bots", example = "620")
    private long activeBots;

    @Schema(description = "Active bots change", example = "+5.0%")
    private String activeBotsChange;

    @Schema(description = "Total automation flow schemas", example = "1890")
    private long totalAutomations;

    @Schema(description = "Total automations change", example = "+11.1%")
    private String totalAutomationsChange;

    @Schema(description = "Total messages sent through platform", example = "1420500")
    private long totalMessagesSent;

    @Schema(description = "Total messages change", example = "+22.4%")
    private String totalMessagesSentChange;

    @Schema(description = "System uptime in seconds", example = "864000")
    private long systemUptimeSeconds;

    @Schema(description = "Active support managers count", example = "4")
    private long activeManagers;

    @Schema(description = "Daily user growth metrics history")
    private List<GrowthMetric> userGrowth;

    @Schema(description = "Bot activity history")
    private List<ActivityMetric> botActivity;

    @Schema(description = "Monthly Recurring Revenue (USD)", example = "4950.00")
    private double mrr;

    @Schema(description = "MRR growth percentage change", example = "+18.3%")
    private String mrrChange;

    @Schema(description = "Average Customer Lifetime Value (USD)", example = "180.00")
    private double ltv;

    @Schema(description = "LTV change", example = "+4.5%")
    private String ltvChange;

    @Schema(description = "Subscription plan distribution breakdown")
    private List<PlanDistributionDto> planDistribution;

    @Schema(description = "Integrations usage popularity")
    private List<IntegrationPopularityDto> integrationsPopularity;

    @Schema(description = "Audience geography and language distribution")
    private List<ClientGeoLangDto> geographyAndLanguages;

    @Schema(description = "Platform service health checks")
    private ServerHealthDto serverHealth;

    @Schema(description = "Recent system logs preview")
    private List<AdminLogDto> latestLogs;

    @Schema(description = "Real-time performance metrics (error rate, latency)")
    private List<PerformanceMetricDto> performanceMetrics;

    @Schema(description = "Performance metrics snapshot")
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class PerformanceMetricDto {
        @Schema(description = "Time label", example = "14:00")
        private String time;

        @Schema(description = "Error rate percentage", example = "0.02")
        private double errorRate;

        @Schema(description = "Average latency in ms", example = "45")
        private int latency;
    }

    @Schema(description = "Integration popularity breakdown")
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class IntegrationPopularityDto {
        @Schema(description = "Integration name", example = "Google Sheets")
        private String name;

        @Schema(description = "Active count", example = "120")
        private long count;

        @Schema(description = "Share percentage", example = "45.0")
        private double percentage;

        @Schema(description = "Growth change", example = "+5%")
        private String change;
    }

    @Schema(description = "Client language/geography distribution entry")
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class ClientGeoLangDto {
        @Schema(description = "Language / country name", example = "Ukrainian (uk)")
        private String name;

        @Schema(description = "Subscriber count", example = "45000")
        private long count;

        @Schema(description = "Percentage of total audience", example = "60.0")
        private double percentage;

        @Schema(description = "Change vs previous period", example = "+3%")
        private String change;
    }

    @Schema(description = "Subscription plan share")
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class PlanDistributionDto {
        @Schema(description = "Plan name", example = "PRO")
        private String name;

        @Schema(description = "Active subscriber count", example = "240")
        private long value;

        @Schema(description = "Chart color hex code", example = "#3b82f6")
        private String color;
    }

    @Schema(description = "Growth metric entry by date")
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class GrowthMetric {
        @Schema(description = "Date string (yyyy-MM-dd)", example = "2026-08-18")
        private String date;

        @Schema(description = "New registered users", example = "25")
        private long registeredCount;

        @Schema(description = "Active users", example = "180")
        private long activeCount;

        @Schema(description = "Clients count", example = "450")
        private long clientsCount;

        @Schema(description = "Bots created", example = "12")
        private long botsCount;

        @Schema(description = "Automations executed", example = "350")
        private long automationsCount;

        @Schema(description = "Messages processed", example = "12500")
        private long messagesCount;
    }

    @Schema(description = "Activity metric entry by date")
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ActivityMetric {
        @Schema(description = "Date string", example = "2026-08-18")
        private String date;

        @Schema(description = "Messages exchanged count", example = "14200")
        private long messagesCount;
    }

    @Schema(description = "Core system health statuses")
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ServerHealthDto {
        @Schema(description = "PostgreSQL DB status string", example = "ONLINE")
        private String dbStatus;

        @Schema(description = "DB healthy boolean flag", example = "true")
        private boolean dbHealthy;

        @Schema(description = "Telegram bot connection status", example = "ONLINE")
        private String telegramStatus;

        @Schema(description = "Telegram bot healthy boolean flag", example = "true")
        private boolean telegramHealthy;

        @Schema(description = "AI providers status", example = "ONLINE")
        private String aiStatus;

        @Schema(description = "AI providers healthy boolean flag", example = "true")
        private boolean aiHealthy;

        @Schema(description = "Broadcast queue status", example = "IDLE")
        private String broadcastStatus;

        @Schema(description = "Broadcast service healthy boolean flag", example = "true")
        private boolean broadcastHealthy;
    }
}

