package com.launchly.bot.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "High-level bot runtime state and subscriber count")
public record BotStatsResponse(
        @Schema(description = "Total subscribers count", example = "350")
        long totalUsers,

        @Schema(description = "Whether the bot is currently active", example = "true")
        boolean active
) {}

