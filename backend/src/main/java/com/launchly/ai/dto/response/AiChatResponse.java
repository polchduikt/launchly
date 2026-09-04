package com.launchly.ai.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Response returned from AI assistant chat")
public record AiChatResponse(
    @Schema(description = "Session ID if persisted", example = "10")
    Long sessionId,

    @Schema(description = "Updated or assigned session title", example = "Google Sheets setup")
    String sessionTitle,

    @Schema(description = "AI generated markdown response text", example = "Щоб підключити Google Таблиці, перейдіть у розділ Інтеграції та авторизуйте ваш обліковий запис Google...")
    String reply,

    @Schema(description = "Updated AI usage and remaining quota metrics")
    AiUsageResponse usage,

    @Schema(description = "Full list of messages in session if session was loaded/updated")
    List<AiChatMessageResponse> messages
) {
    public AiChatResponse(String reply, AiUsageResponse usage) {
        this(null, null, reply, usage, null);
    }
}

