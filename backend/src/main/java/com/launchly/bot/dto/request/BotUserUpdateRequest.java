package com.launchly.bot.dto.request;

import java.util.List;

public record BotUserUpdateRequest(
        String firstName,
        String lastName,
        String metadata,
        List<String> tags
) {}
