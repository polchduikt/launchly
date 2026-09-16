package com.launchly.ai.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "Single chat message in an AI conversation")
public record AiChatMessageResponse(
    @Schema(description = "Message ID", example = "1")
    Long id,

    @Schema(description = "Message sender role: user, assistant, system", example = "user")
    String role,

    @Schema(description = "Message markdown content text")
    String content,

    @Schema(description = "Estimated token count consumed by message", example = "42")
    Integer tokensUsed,

    @Schema(description = "Creation timestamp")
    LocalDateTime createdAt
) {}
