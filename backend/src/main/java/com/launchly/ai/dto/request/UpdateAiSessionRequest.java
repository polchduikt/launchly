package com.launchly.ai.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Request payload to update an AI chat session")
public record UpdateAiSessionRequest(
    @Schema(description = "New title for the session", example = "CRM Automation Ideas", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Session title cannot be blank")
    @Size(max = 255, message = "Session title must not exceed 255 characters")
    String title
) {}
