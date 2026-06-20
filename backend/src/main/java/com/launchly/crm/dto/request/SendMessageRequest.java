package com.launchly.crm.dto.request;

import jakarta.validation.constraints.NotBlank;

public record SendMessageRequest(
        @NotBlank(message = "Message content is required")
        String content,
        String mediaUrl,
        String mediaType
) {}
