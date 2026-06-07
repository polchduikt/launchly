package com.launchly.integration.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import java.util.List;

public record WebhookConfig(
    @NotBlank(message = "A valid Webhook URL starting with http/https is required")
    @Pattern(regexp = "^https?://.*", message = "A valid Webhook URL starting with http/https is required")
    String url,

    @NotEmpty(message = "At least one target event is required for Webhooks")
    List<@NotBlank(message = "Event name is required") @Pattern(regexp = "(?i)^(ORDER_CREATED|LEAD_CREATED)$", message = "Invalid event") String> events,

    String secret
) {}
