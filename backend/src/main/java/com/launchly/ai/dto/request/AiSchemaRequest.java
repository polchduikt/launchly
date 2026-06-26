package com.launchly.ai.dto.request;

import com.launchly.ai.dto.AiMessage;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record AiSchemaRequest(
    @NotBlank(message = "Description is required")
    String description,
    List<AiMessage> history
) {}
