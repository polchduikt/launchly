package com.launchly.billing.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Stripe Hosted Checkout URL response")
public record CheckoutResponse(
    @Schema(description = "Redirect URL to Stripe hosted checkout page", example = "https://checkout.stripe.com/c/pay/cs_test_a1b2c3d4...")
    String checkoutUrl
) {}

