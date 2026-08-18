package com.launchly.billing.util;

import com.launchly.billing.entity.SubscriptionStatus;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

public final class StripeUtils {

    private StripeUtils() {
    }

    public static LocalDateTime mapEpoch(Long epoch) {
        if (epoch == null) return null;
        return LocalDateTime.ofInstant(Instant.ofEpochSecond(epoch), ZoneId.systemDefault());
    }

    public static SubscriptionStatus mapStripeStatus(String stripeStatus) {
        if (stripeStatus == null) return SubscriptionStatus.ACTIVE;
        return switch (stripeStatus.toLowerCase()) {
            case "active" -> SubscriptionStatus.ACTIVE;
            case "past_due" -> SubscriptionStatus.PAST_DUE;
            case "trialing" -> SubscriptionStatus.TRIALING;
            case "canceled", "unpaid" -> SubscriptionStatus.CANCELLED;
            default -> SubscriptionStatus.ACTIVE;
        };
    }
}
