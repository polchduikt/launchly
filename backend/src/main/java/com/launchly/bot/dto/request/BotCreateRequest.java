package com.launchly.bot.dto.request;

import com.launchly.common.validation.ValidTelegramToken;
import jakarta.validation.constraints.NotBlank;

public record BotCreateRequest(

        @NotBlank(message = "Bot name is required")
        String name,

        String description,

        @NotBlank(message = "Telegram token is required")
        @ValidTelegramToken
        String telegramToken
) {}
