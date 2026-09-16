package com.launchly.billing.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request payload to confirm a Stripe Checkout session")
public record ConfirmSessionRequest(
        @Schema(description = "Stripe Checkout session ID", example = "cs_test_1234567890", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "validation.billing.session_id.required")
        String sessionId
) {}
