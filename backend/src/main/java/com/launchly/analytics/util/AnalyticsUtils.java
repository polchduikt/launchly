package com.launchly.analytics.util;

public final class AnalyticsUtils {

    private AnalyticsUtils() {
    }

    public static double calculateGrowth(long prev, long curr) {
        if (prev == 0) {
            return curr * 100.0;
        }
        double diff = (double) curr - prev;
        double growth = (diff / prev) * 100.0;
        return Math.round(growth * 10.0) / 10.0;
    }
}
