package com.launchly.billing.service;

import com.launchly.billing.dto.response.CheckoutResponse;
import com.launchly.billing.dto.response.PlanResponse;
import com.launchly.billing.dto.response.SubscriptionResponse;
import java.util.List;

public interface BillingService {
    void createFreeSubscription(Long userId);
    List<PlanResponse> getAvailablePlans();
    SubscriptionResponse getSubscriptionByUser(Long userId);
    CheckoutResponse createCheckoutSession(Long planId, Long userId);
    SubscriptionResponse cancelSubscription(Long userId);
    SubscriptionResponse resumeSubscription(Long userId);
    void handleStripeWebhook(String payload, String sigHeader);
}
