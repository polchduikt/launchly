package com.launchly.bot.dto.request;

public record BotUpdateRequest(
        String name,
        String description,
        String avatar,
        String avatarPublicId,
        String telegramToken
) {}
