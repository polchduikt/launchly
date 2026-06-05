package com.launchly.integration.dto.request;

import com.launchly.integration.entity.IntegrationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record IntegrationCreateRequest(
    @NotBlank(message = "Name is required")
    String name,

    @NotNull(message = "Type is required")
    IntegrationType type,

    @NotNull(message = "Bot ID is required")
    Long botId,

    Object config
) {}
