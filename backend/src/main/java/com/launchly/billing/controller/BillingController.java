package com.launchly.billing.controller;

import com.launchly.billing.dto.request.CheckoutRequest;
import com.launchly.billing.dto.response.CheckoutResponse;
import com.launchly.billing.dto.response.PlanResponse;
import com.launchly.billing.dto.response.SubscriptionResponse;
import com.launchly.billing.service.BillingService;
import com.launchly.common.security.CustomUserDetails;
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

@RestController
@RequestMapping("/api/v1/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @GetMapping("/plans")
    public ResponseEntity<List<PlanResponse>> getPlans() {
        return ResponseEntity.ok(billingService.getAvailablePlans());
    }

    @GetMapping("/subscription")
    public ResponseEntity<SubscriptionResponse> getSubscription(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(billingService.getSubscriptionByUser(userDetails.getId()));
    }

    @PostMapping("/subscription/checkout")
    public ResponseEntity<CheckoutResponse> checkout(@Valid @RequestBody CheckoutRequest request,
                                                     @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(billingService.createCheckoutSession(request.planId(), userDetails.getId()));
    }

    @PostMapping("/subscription/cancel")
    public ResponseEntity<SubscriptionResponse> cancelSubscription(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(billingService.cancelSubscription(userDetails.getId()));
    }

    @PostMapping("/subscription/resume")
    public ResponseEntity<SubscriptionResponse> resumeSubscription(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(billingService.resumeSubscription(userDetails.getId()));
    }

    @PostMapping("/subscription/confirm-session")
    public ResponseEntity<SubscriptionResponse> confirmSession(@RequestBody java.util.Map<String, String> request,
                                                               @AuthenticationPrincipal CustomUserDetails userDetails) {
        String sessionId = request.get("sessionId");
        return ResponseEntity.ok(billingService.confirmCheckoutSession(sessionId, userDetails.getId()));
    }
}
