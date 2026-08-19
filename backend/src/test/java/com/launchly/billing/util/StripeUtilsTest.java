package com.launchly.billing.util;

import com.launchly.billing.entity.SubscriptionStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class StripeUtilsTest {

    @Test
    @DisplayName("Should convert epoch seconds to LocalDateTime")
    void mapEpoch_ValidTimestamp_ReturnsLocalDateTime() {
        LocalDateTime time = StripeUtils.mapEpoch(1700000000L);
        assertThat(time).isNotNull();
        assertThat(time.getYear()).isEqualTo(2023);
    }

    @Test
    @DisplayName("Should return null when epoch is null")
    void mapEpoch_NullTimestamp_ReturnsNull() {
        assertThat(StripeUtils.mapEpoch(null)).isNull();
    }

    @Test
    @DisplayName("Should map Stripe status strings to internal SubscriptionStatus enum")
    void mapStripeStatus_VariousStatuses_MappedCorrectly() {
        assertThat(StripeUtils.mapStripeStatus("active")).isEqualTo(SubscriptionStatus.ACTIVE);
        assertThat(StripeUtils.mapStripeStatus("past_due")).isEqualTo(SubscriptionStatus.PAST_DUE);
        assertThat(StripeUtils.mapStripeStatus("trialing")).isEqualTo(SubscriptionStatus.TRIALING);
        assertThat(StripeUtils.mapStripeStatus("canceled")).isEqualTo(SubscriptionStatus.CANCELLED);
        assertThat(StripeUtils.mapStripeStatus("unpaid")).isEqualTo(SubscriptionStatus.CANCELLED);
        assertThat(StripeUtils.mapStripeStatus("unknown_status")).isEqualTo(SubscriptionStatus.ACTIVE);
        assertThat(StripeUtils.mapStripeStatus(null)).isEqualTo(SubscriptionStatus.ACTIVE);
    }
}
