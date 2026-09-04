package com.launchly.ai.dto.request;

import com.launchly.ai.dto.AiMessage;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

@Schema(description = "Request payload for AI assistant conversational chat")
public record AiChatRequest(
    @Schema(description = "Optional session ID to persist dialogue turn within an ongoing conversation", example = "10")
    Long sessionId,

    @Schema(description = "User input message prompt", example = "Як підключити Google Таблиці до мого чат-бота?", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Message is required")
    String message,

    @Schema(description = "Previous dialogue turns for conversational context (used when sessionId is omitted)")
    List<AiMessage> history
) {
    public AiChatRequest(String message, List<AiMessage> history) {
        this(null, message, history);
    }
}

