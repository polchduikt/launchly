package com.launchly.common.utils;

public final class MathUtils {

    private MathUtils() {
    }

    public static double round2(double val) {
        return Math.round(val * 100.0) / 100.0;
    }

    public static String calcChange(long current, long prev) {
        if (prev == 0) {
            return current > 0 ? "+100%" : "0%";
        }
        double change = ((double) (current - prev) / prev) * 100;
        return (change >= 0 ? "+" : "") + Math.round(change) + "%";
    }

    public static double calcChangePct(double current, double prev) {
        if (prev == 0) {
            return current > 0 ? 100.0 : 0.0;
        }
        return round2(((current - prev) / prev) * 100.0);
    }
}
