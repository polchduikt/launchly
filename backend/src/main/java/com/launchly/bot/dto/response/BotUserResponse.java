package com.launchly.bot.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record BotUserResponse(
        Long id,
        Long telegramId,
        String username,
        String firstName,
        String lastName,
        String currentNodeId,
        String photoUrl,
        String metadata,
        List<String> tags,
        LocalDateTime createdAt
) {}
