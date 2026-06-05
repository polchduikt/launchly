package com.launchly.billing.dto.response;

import java.time.LocalDateTime;

public record SubscriptionResponse(
    Long id,
    String status,
    boolean cancelAtPeriodEnd,
    LocalDateTime currentPeriodStart,
    LocalDateTime currentPeriodEnd,
    PlanResponse plan
) {}
