package com.launchly.billing.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Request payload to initiate a Stripe checkout session for a subscription plan")
public record CheckoutRequest(
    @Schema(description = "ID of the target subscription plan", example = "2", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Plan ID is required")
    Long planId
) {}

