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
    private long activeBots;
    private long totalAutomations;
    private long totalMessagesSent;
    private long systemUptimeSeconds;
    private long activeManagers;
    private List<GrowthMetric> userGrowth;
    private List<ActivityMetric> botActivity;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class GrowthMetric {
        private String date;
        private long count;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ActivityMetric {
        private String date;
        private long messagesCount;
    }
}
