package com.launchly.ai.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "Summary of an AI chat session")
public record AiChatSessionResponse(
    @Schema(description = "Session ID", example = "10")
    Long id,

    @Schema(description = "Session display title", example = "Telegram bot setup")
    String title,

    @Schema(description = "Creation timestamp")
    LocalDateTime createdAt,

    @Schema(description = "Last update timestamp")
    LocalDateTime updatedAt,

    @Schema(description = "Last message preview snippet if available")
    String lastMessage
) {}
