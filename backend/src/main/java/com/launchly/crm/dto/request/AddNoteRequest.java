package com.launchly.crm.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request payload to attach an internal agent note to a conversation")
public record AddNoteRequest(
        @Schema(description = "Internal note text content", example = "Client requested callback tomorrow morning", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "Note content is required")
        String content
) {}

