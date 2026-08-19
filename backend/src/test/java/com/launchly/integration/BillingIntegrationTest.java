package com.launchly.integration;

import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import com.launchly.billing.dto.request.CheckoutRequest;
import com.launchly.billing.entity.Plan;
import com.launchly.billing.entity.Subscription;
import com.launchly.billing.entity.SubscriptionStatus;
import com.launchly.billing.repository.PlanRepository;
import com.launchly.billing.repository.SubscriptionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class BillingIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Test
    @DisplayName("Should retrieve public plans list from database seeded by Liquibase")
    void getPlans_Success() throws Exception {
        User user = createTestUser("planviewer", Role.ROLE_OWNER);

        mockMvc.perform(get("/api/v1/billing/plans")
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").isNotEmpty());

        List<Plan> plans = planRepository.findAll();
        assertThat(plans).isNotEmpty();
    }

    @Test
    @DisplayName("Should retrieve active subscription or auto-create FREE subscription for new user")
    void getSubscription_AutoCreateFree_Success() throws Exception {
        User user = createTestUser("billuser", Role.ROLE_OWNER);

        mockMvc.perform(get("/api/v1/billing/subscription")
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plan.name").isNotEmpty());

        Subscription subscription = subscriptionRepository.findByUserId(user.getId()).orElse(null);
        assertThat(subscription).isNotNull();
        assertThat(subscription.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);
    }

    @Test
    @DisplayName("Should reject checkout session creation for free plan")
    void createCheckoutSession_FreePlan_ReturnsBadRequest() throws Exception {
        User user = createTestUser("freecheckout", Role.ROLE_OWNER);
        Plan freePlan = planRepository.findByName("FREE")
                .or(() -> planRepository.findAll().stream().filter(p -> p.getPrice().compareTo(BigDecimal.ZERO) == 0).findFirst())
                .orElseThrow();

        CheckoutRequest request = new CheckoutRequest(freePlan.getId());

        mockMvc.perform(post("/api/v1/billing/subscription/checkout")
                        .header("Authorization", getAuthHeader(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should reject subscription cancel with 404 when no subscription record exists")
    void cancelSubscription_NoSubRecord_ReturnsNotFound() throws Exception {
        User user = createTestUser("cancelsub", Role.ROLE_OWNER);

        mockMvc.perform(post("/api/v1/billing/subscription/cancel")
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().isNotFound());
    }
}
