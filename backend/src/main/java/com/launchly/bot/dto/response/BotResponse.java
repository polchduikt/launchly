package com.launchly.bot.dto.response;

import java.time.LocalDateTime;

public record BotResponse(
        Long id,
        String name,
        String username,
        String description,
        String avatar,
        String avatarPublicId,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        long totalUsers,
        boolean hasTelegramToken
) {}
