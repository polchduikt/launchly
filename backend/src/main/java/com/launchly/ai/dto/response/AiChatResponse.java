package com.launchly.ai.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Response returned from AI assistant chat")
public record AiChatResponse(
    @Schema(description = "AI generated markdown response text", example = "Щоб підключити Google Таблиці, перейдіть у розділ Інтеграції та авторизуйте ваш обліковий запис Google...")
    String reply,

    @Schema(description = "Updated AI usage and remaining quota metrics")
    AiUsageResponse usage
) {}

