package com.launchly.billing.mapper;

import com.launchly.auth.entity.User;
import com.launchly.billing.dto.response.PlanResponse;
import com.launchly.billing.dto.response.SubscriptionResponse;
import com.launchly.billing.entity.Plan;
import com.launchly.billing.entity.Subscription;
import com.launchly.billing.entity.SubscriptionStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class BillingMapperTest {

    private BillingMapper billingMapper;

    @BeforeEach
    void setUp() {
        billingMapper = Mappers.getMapper(BillingMapper.class);
    }

    @Test
    @DisplayName("Should map Plan entity to PlanResponse")
    void toPlanResponse_Success() {
        Plan plan = Plan.builder()
                .name("PRO")
                .price(new BigDecimal("29.99"))
                .active(true)
                .build();
        ReflectionTestUtils.setField(plan, "id", 10L);

        PlanResponse response = billingMapper.toPlanResponse(plan);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getName()).isEqualTo("PRO");
        assertThat(response.getPrice()).isEqualByComparingTo(new BigDecimal("29.99"));
    }

    @Test
    @DisplayName("Should map Subscription entity to SubscriptionResponse")
    void toSubscriptionResponse_Success() {
        User user = User.builder().email("billing@launchly.pro").build();
        ReflectionTestUtils.setField(user, "id", 1L);

        Plan plan = Plan.builder().name("STARTER").price(new BigDecimal("9.99")).build();
        ReflectionTestUtils.setField(plan, "id", 5L);

        Subscription subscription = Subscription.builder()
                .user(user)
                .plan(plan)
                .status(SubscriptionStatus.ACTIVE)
                .stripeSubscriptionId("sub_12345")
                .build();
        ReflectionTestUtils.setField(subscription, "id", 100L);

        SubscriptionResponse response = billingMapper.toSubscriptionResponse(subscription);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(100L);
        assertThat(response.getStatus()).isEqualTo("ACTIVE");
    }
}
