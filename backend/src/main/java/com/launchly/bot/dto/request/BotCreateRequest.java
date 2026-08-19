package com.launchly.bot.dto.request;

import com.launchly.common.validation.ValidTelegramToken;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request payload to create a new Telegram bot")
public record BotCreateRequest(

        @Schema(description = "Bot display name", example = "Customer Support Bot", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "Bot name is required")
        String name,

        @Schema(description = "Optional bot description / notes", example = "Automated support bot for onboarding and FAQs")
        String description,

        @Schema(description = "Telegram Bot Token from @BotFather (format: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ)", example = "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ")
        @ValidTelegramToken
        String telegramToken,

        @Schema(description = "Optional Bot ID to copy existing Telegram token from", example = "5")
        Long copyTokenFromBotId
) {}

