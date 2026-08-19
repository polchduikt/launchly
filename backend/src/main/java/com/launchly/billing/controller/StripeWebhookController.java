package com.launchly.billing.controller;

import com.launchly.billing.service.BillingService;
import com.launchly.common.exception.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Billing: Webhooks", description = "Stripe incoming asynchronous webhook event processing")
@RestController
@RequestMapping("/api/v1/billing/webhook")
@RequiredArgsConstructor
public class StripeWebhookController {

    private final BillingService billingService;

    @Operation(summary = "Stripe webhook listener", description = "Receives signed asynchronous event notifications from Stripe (checkout.session.completed, invoice.payment_succeeded, customer.subscription.deleted).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Webhook event handled successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid signature or malformed payload", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping
    public ResponseEntity<Void> handleWebhook(
            @Parameter(description = "Raw webhook payload JSON") @RequestBody String payload,
            @Parameter(description = "Stripe cryptographic signature header") @RequestHeader("Stripe-Signature") String sigHeader) {
        billingService.handleStripeWebhook(payload, sigHeader);
        return ResponseEntity.ok().build();
    }
}

