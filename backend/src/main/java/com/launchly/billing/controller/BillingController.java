package com.launchly.billing.controller;

import com.launchly.billing.dto.request.CheckoutRequest;
import com.launchly.billing.dto.response.CheckoutResponse;
import com.launchly.billing.dto.response.PlanResponse;
import com.launchly.billing.dto.response.SubscriptionResponse;
import com.launchly.billing.service.BillingService;
import com.launchly.common.exception.ErrorResponse;
import com.launchly.common.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@Tag(name = "Billing: Plans & Subscriptions", description = "Subscription tiers, Stripe Checkout session management, and plan lifecycle operations")
@RestController
@RequestMapping("/api/v1/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @Operation(summary = "Get all available subscription plans", description = "Retrieve list of all subscription plan tiers with prices, bot limits, broadcast quotas, and feature flags.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of subscription plans", content = @Content(array = @ArraySchema(schema = @Schema(implementation = PlanResponse.class))))
    })
    @GetMapping("/plans")
    public ResponseEntity<List<PlanResponse>> getPlans() {
        return ResponseEntity.ok(billingService.getAvailablePlans());
    }

    @Operation(summary = "Get user subscription status", description = "Retrieve active subscription details, current billing period, cancellation status, and plan limits.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Current subscription details"),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/subscription")
    public ResponseEntity<SubscriptionResponse> getSubscription(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(billingService.getSubscriptionByUser(userDetails.getId()));
    }

    @Operation(summary = "Create Stripe Checkout session", description = "Initiate a Stripe Checkout session to upgrade or purchase a subscription plan.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Stripe Checkout session URL created"),
            @ApiResponse(responseCode = "400", description = "Invalid plan ID", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/subscription/checkout")
    public ResponseEntity<CheckoutResponse> checkout(@Valid @RequestBody CheckoutRequest request,
                                                     @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(billingService.createCheckoutSession(request.planId(), userDetails.getId()));
    }

    @Operation(summary = "Cancel subscription at period end", description = "Schedule subscription cancellation at the end of the current billing cycle without immediate loss of access.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Subscription cancellation scheduled"),
            @ApiResponse(responseCode = "400", description = "No active subscription found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/subscription/cancel")
    public ResponseEntity<SubscriptionResponse> cancelSubscription(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(billingService.cancelSubscription(userDetails.getId()));
    }

    @Operation(summary = "Resume scheduled subscription cancellation", description = "Reactivate an active subscription that was previously marked for cancellation at period end.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Subscription resumed successfully"),
            @ApiResponse(responseCode = "400", description = "Subscription cannot be resumed", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/subscription/resume")
    public ResponseEntity<SubscriptionResponse> resumeSubscription(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(billingService.resumeSubscription(userDetails.getId()));
    }

    @Operation(summary = "Confirm Stripe Checkout session", description = "Verify and apply subscription state following a successful Stripe checkout redirect.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Subscription confirmed and activated"),
            @ApiResponse(responseCode = "400", description = "Invalid session ID", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/subscription/confirm-session")
    public ResponseEntity<SubscriptionResponse> confirmSession(@RequestBody java.util.Map<String, String> request,
                                                               @AuthenticationPrincipal CustomUserDetails userDetails) {
        String sessionId = request.get("sessionId");
        return ResponseEntity.ok(billingService.confirmCheckoutSession(sessionId, userDetails.getId()));
    }
}

