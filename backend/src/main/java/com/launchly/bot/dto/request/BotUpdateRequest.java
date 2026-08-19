package com.launchly.bot.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Request payload to update Telegram bot settings")
public record BotUpdateRequest(
        @Schema(description = "Updated bot name", example = "Sales & Support Bot")
        String name,

        @Schema(description = "Updated description / notes", example = "Handles orders and lead collection")
        String description,

        @Schema(description = "Avatar image URL", example = "https://res.cloudinary.com/demo/image/upload/bot.jpg")
        String avatar,

        @Schema(description = "Cloudinary public ID of uploaded avatar", example = "launchly/bots/bot_123")
        String avatarPublicId,

        @Schema(description = "New Telegram Bot Token from @BotFather", example = "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ")
        String telegramToken,

        @Schema(description = "Bot ID to copy token from", example = "3")
        Long copyTokenFromBotId
) {}

