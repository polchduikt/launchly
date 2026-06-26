package com.launchly.ai.dto.request;

import com.launchly.ai.dto.AiMessage;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record AiChatRequest(
    @NotBlank(message = "Message is required")
    String message,
    List<AiMessage> history
) {}
