package com.launchly.bot.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "Complete Telegram bot details including configuration and flow schema")
public record BotDetailResponse(
        @Schema(description = "Bot unique ID", example = "5")
        Long id,

        @Schema(description = "Bot display name", example = "Sales Bot")
        String name,

        @Schema(description = "Telegram bot @username", example = "launchly_sales_bot")
        String username,

        @Schema(description = "Bot description / purpose", example = "E-commerce onboarding bot")
        String description,

        @Schema(description = "Avatar URL")
        String avatar,

        @Schema(description = "Cloudinary public ID")
        String avatarPublicId,

        @Schema(description = "Whether the bot is currently running", example = "true")
        boolean active,

        @Schema(description = "Masked or full Telegram token")
        String telegramToken,

        @Schema(description = "Connected active visual workflow schema")
        FlowSchemaResponse flowSchema,

        @Schema(description = "Bot creation timestamp")
        LocalDateTime createdAt,

        @Schema(description = "Whether this bot was installed from a template", example = "false")
        boolean isTemplate,

        @Schema(description = "Template name if installed from a template")
        String templateName
) {}

