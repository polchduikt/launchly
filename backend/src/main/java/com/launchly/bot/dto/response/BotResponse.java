package com.launchly.bot.dto.response;

import java.time.LocalDateTime;

public record BotResponse(
        Long id,
        String name,
        String description,
        String avatar,
        boolean active,
        LocalDateTime createdAt
) {}
