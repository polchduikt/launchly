package com.launchly.analytics.service;

import com.launchly.analytics.dto.response.DashboardStatsResponse;
import com.launchly.analytics.entity.AnalyticsEventType;
import com.launchly.bot.entity.BotUser;

public interface AnalyticsService {
    void logEvent(Long botId, BotUser botUser, AnalyticsEventType type, String name);
    DashboardStatsResponse getDashboardStats(Long botId, int days, Long userId);
}
