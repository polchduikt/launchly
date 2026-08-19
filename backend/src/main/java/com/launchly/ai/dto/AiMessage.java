package com.launchly.ai.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Single dialogue turn in AI conversation history")
public record AiMessage(
    @Schema(description = "Message role: user, assistant, or system", example = "user")
    String role,

    @Schema(description = "Message content", example = "Створи бот для запису клієнтів на стрижку")
    String content
) {}

