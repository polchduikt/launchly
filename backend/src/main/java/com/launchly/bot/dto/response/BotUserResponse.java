package com.launchly.bot.dto.response;

import java.time.LocalDateTime;

public record BotUserResponse(
        Long id,
        Long telegramId,
        String username,
        String firstName,
        String lastName,
        String currentNodeId,
        LocalDateTime createdAt
) {}
