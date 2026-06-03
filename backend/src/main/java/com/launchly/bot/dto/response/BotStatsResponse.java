package com.launchly.bot.dto.response;

public record BotStatsResponse(
        long totalUsers,
        boolean active
) {}
