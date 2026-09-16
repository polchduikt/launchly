package com.launchly.ai.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.List;

@Schema(description = "Detailed AI chat session including full message history")
public record AiChatSessionDetailResponse(
    @Schema(description = "Session ID", example = "10")
    Long id,

    @Schema(description = "Session display title", example = "Telegram bot setup")
    String title,

    @Schema(description = "Creation timestamp")
    LocalDateTime createdAt,

    @Schema(description = "Last update timestamp")
    LocalDateTime updatedAt,

    @Schema(description = "Chronological list of dialogue messages")
    List<AiChatMessageResponse> messages
) {}
