package com.launchly.bot.dto.response;

import java.time.LocalDateTime;

public record BotDetailResponse(
        Long id,
        String name,
        String description,
        String avatar,
        String avatarPublicId,
        boolean active,
        String telegramToken,
        FlowSchemaResponse flowSchema,
        LocalDateTime createdAt
) {}
