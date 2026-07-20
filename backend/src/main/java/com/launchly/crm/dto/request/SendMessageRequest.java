package com.launchly.crm.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

public record SendMessageRequest(
        @NotBlank(message = "Message content is required")
        String content,
        String mediaUrl,
        String mediaType,
        LocalDateTime scheduledAt
) {}
