package com.launchly.bot.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "Telegram bot summary representation for list views")
public record BotResponse(
        @Schema(description = "Bot ID", example = "5")
        Long id,

        @Schema(description = "Bot name", example = "Sales Bot")
        String name,

        @Schema(description = "Telegram username", example = "launchly_sales_bot")
        String username,

        @Schema(description = "Bot description", example = "Customer lead collection")
        String description,

        @Schema(description = "Avatar URL")
        String avatar,

        @Schema(description = "Cloudinary public ID")
        String avatarPublicId,

        @Schema(description = "Whether the bot is currently running", example = "true")
        boolean active,

        @Schema(description = "Whether the bot is blocked by administrator", example = "false")
        boolean blocked,

        @Schema(description = "Block reason if blocked")
        String blockReason,

        @Schema(description = "Creation date")
        LocalDateTime createdAt,

        @Schema(description = "Last update date")
        LocalDateTime updatedAt,

        @Schema(description = "Total subscribers count", example = "420")
        long totalUsers,

        @Schema(description = "Whether a Telegram token is configured", example = "true")
        boolean hasTelegramToken,

        @Schema(description = "Current user's membership role on this bot: OWNER, ADMIN, EDITOR, VIEWER", example = "OWNER")
        String role,

        @Schema(description = "Whether installed from template", example = "false")
        boolean isTemplate,

        @Schema(description = "Template name if applicable")
        String templateName,

        @Schema(description = "Total flow execution runs count", example = "1580")
        int runs
) {}

