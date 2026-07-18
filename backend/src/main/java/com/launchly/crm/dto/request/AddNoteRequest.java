package com.launchly.crm.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AddNoteRequest(
        @NotBlank(message = "Note content is required")
        String content
) {}
