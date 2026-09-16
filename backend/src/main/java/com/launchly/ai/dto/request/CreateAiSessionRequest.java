package com.launchly.ai.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

@Schema(description = "Request payload to initialize a new AI chat session")
public record CreateAiSessionRequest(
    @Schema(description = "Optional custom session title", example = "Sales Bot Consultation")
    @Size(max = 255, message = "Session title must not exceed 255 characters")
    String title
) {}
