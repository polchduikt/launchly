package com.launchly.bot.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.List;

@Schema(description = "Telegram bot contact / subscriber details")
public record BotUserResponse(
        @Schema(description = "Subscriber ID", example = "101")
        Long id,

        @Schema(description = "Telegram user ID", example = "987654321")
        Long telegramId,

        @Schema(description = "Telegram username", example = "oleksandr_k")
        String username,

        @Schema(description = "First name", example = "Олександр")
        String firstName,

        @Schema(description = "Last name", example = "Коваленко")
        String lastName,

        @Schema(description = "ID of current visual flow node subscriber is located at", example = "node_welcome_1")
        String currentNodeId,

        @Schema(description = "Telegram profile photo URL")
        String photoUrl,

        @Schema(description = "Custom JSON metadata / form field responses", example = "{\"email\": \"oleksandr@example.com\"}")
        String metadata,

        @Schema(description = "Assigned contact tags", example = "[\"VIP\", \"LEAD\"]")
        List<String> tags,

        @Schema(description = "Subscribed timestamp")
        LocalDateTime createdAt
) {}

