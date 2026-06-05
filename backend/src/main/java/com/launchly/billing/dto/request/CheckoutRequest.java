package com.launchly.billing.dto.request;

import jakarta.validation.constraints.NotNull;

public record CheckoutRequest(
    @NotNull(message = "Plan ID is required")
    Long planId
) {}
