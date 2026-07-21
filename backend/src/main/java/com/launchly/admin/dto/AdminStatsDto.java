package com.launchly.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsDto {
    private long totalUsers;
    private long totalOwners;
    private String totalOwnersChange;
    private long activeOwners;
    private String activeOwnersChange;
    private long totalBotUsers;
    private String totalBotUsersChange;
    private long activeBots;
    private String activeBotsChange;
    private long totalAutomations;
    private String totalAutomationsChange;
    private long totalMessagesSent;
    private String totalMessagesSentChange;
    private long systemUptimeSeconds;
    private long activeManagers;
    private List<GrowthMetric> userGrowth;
    private List<ActivityMetric> botActivity;
    private double mrr;
    private String mrrChange;
    private double ltv;
    private String ltvChange;
    private List<PlanDistributionDto> planDistribution;
    private List<IntegrationPopularityDto> integrationsPopularity;
    private List<ClientGeoLangDto> geographyAndLanguages;
    private ServerHealthDto serverHealth;
    private List<AdminLogDto> latestLogs;
    private List<PerformanceMetricDto> performanceMetrics;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class PerformanceMetricDto {
        private String time;
        private double errorRate;
        private int latency;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class IntegrationPopularityDto {
        private String name;
        private long count;
        private double percentage;
        private String change;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class ClientGeoLangDto {
        private String name;
        private long count;
        private double percentage;
        private String change;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class PlanDistributionDto {
        private String name;
        private long value;
        private String color;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class GrowthMetric {
        private String date;
        private long registeredCount;
        private long activeCount;
        private long clientsCount;
        private long botsCount;
        private long automationsCount;
        private long messagesCount;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ActivityMetric {
        private String date;
        private long messagesCount;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ServerHealthDto {
        private String dbStatus;
        private boolean dbHealthy;
        private String telegramStatus;
        private boolean telegramHealthy;
        private String aiStatus;
        private boolean aiHealthy;
        private String broadcastStatus;
        private boolean broadcastHealthy;
    }
}
