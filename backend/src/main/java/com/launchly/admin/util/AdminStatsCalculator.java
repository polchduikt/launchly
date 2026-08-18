package com.launchly.admin.util;

import com.launchly.admin.dto.AdminStatsDto;
import com.launchly.billing.entity.Subscription;
import com.launchly.billing.entity.SubscriptionStatus;
import com.launchly.common.metric.PerformanceMonitoringFilter;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public final class AdminStatsCalculator {

    private AdminStatsCalculator() {
    }

    public static boolean contains(String value, String query) {
        return value != null && query != null && value.toLowerCase().contains(query.toLowerCase());
    }

    public static double calculateMrr(List<Subscription> subscriptions) {
        if (subscriptions == null) return 0.0;
        return subscriptions.stream()
                .filter(sub -> sub.getStatus() == SubscriptionStatus.ACTIVE)
                .mapToDouble(sub -> sub.getPlan() != null && sub.getPlan().getPrice() != null ? sub.getPlan().getPrice().doubleValue() : 0.0)
                .sum();
    }

    public static double calculateLtv(List<Subscription> subscriptions) {
        if (subscriptions == null) return 0.0;
        List<Subscription> paying = subscriptions.stream()
                .filter(sub -> sub.getPlan() != null && sub.getPlan().getPrice() != null && sub.getPlan().getPrice().doubleValue() > 0.0)
                .collect(Collectors.toList());

        if (paying.isEmpty()) return 0.0;

        double totalRevenue = 0.0;
        for (Subscription sub : paying) {
            LocalDateTime subStart = sub.getCreatedAt() != null ? sub.getCreatedAt() : LocalDateTime.now();
            LocalDateTime subEnd = (sub.getStatus() == SubscriptionStatus.CANCELLED && sub.getUpdatedAt() != null)
                    ? sub.getUpdatedAt()
                    : LocalDateTime.now();

            long months = Duration.between(subStart, subEnd).toDays() / 30;
            if (months < 1) months = 1;
            totalRevenue += sub.getPlan().getPrice().doubleValue() * months;
        }
        return totalRevenue / paying.size();
    }

    public static String resolvePlanColor(String displayName) {
        if (displayName == null) return "#6366f1";
        String lower = displayName.toLowerCase();
        if (lower.contains("enterprise") || lower.contains("business")) return "#f59e0b";
        if (lower.contains("starter")) return "#10b981";
        return "#6366f1";
    }

    public static String langToRegion(String lang) {
        if (lang == null) return "Other";
        return switch (lang.toLowerCase()) {
            case "uk" -> "Ukraine";
            case "en" -> "United States";
            case "pl" -> "Poland";
            default -> "Other";
        };
    }

    public static String parseLang(String metadata) {
        if (metadata == null || metadata.isEmpty()) return "unknown";
        String langKey = metadata.contains("\"language_code\"") ? "\"language_code\"" :
                         metadata.contains("\"languageCode\"") ? "\"languageCode\"" : null;
        if (langKey == null) return "unknown";
        int idx = metadata.indexOf(langKey);
        int valStart = metadata.indexOf(":", idx) + 1;
        int quoteStart = metadata.indexOf("\"", valStart);
        if (quoteStart == -1) return "unknown";
        int quoteEnd = metadata.indexOf("\"", quoteStart + 1);
        if (quoteEnd == -1) return "unknown";
        return metadata.substring(quoteStart + 1, quoteEnd).toLowerCase();
    }

    public static List<AdminStatsDto.PerformanceMetricDto> buildPerformanceMetrics() {
        Map<String, PerformanceMonitoringFilter.HourlyMetric> performanceData = PerformanceMonitoringFilter.getHourlyMetrics();
        List<AdminStatsDto.PerformanceMetricDto> metrics = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (int i = 6; i >= 0; i--) {
            LocalDateTime t = now.minusHours(i);
            String timeBucket = t.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:00"));
            String isoTime = t.format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:00:00"));

            PerformanceMonitoringFilter.HourlyMetric metric = performanceData.get(timeBucket);

            double errorRate = 0.0;
            int latency = 0;

            if (metric != null && metric.requestCount.get() > 0) {
                int totalReqs = metric.requestCount.get();
                errorRate = Math.round((metric.errorCount.get() * 10000.0) / totalReqs) / 100.0;
                latency = (int) (metric.totalLatency.get() / totalReqs);
            }

            metrics.add(new AdminStatsDto.PerformanceMetricDto(isoTime, errorRate, latency));
        }
        return metrics;
    }
}
