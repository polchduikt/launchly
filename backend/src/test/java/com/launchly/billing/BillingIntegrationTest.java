package com.launchly.billing;

import com.launchly.BaseIntegrationTest;
import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import com.launchly.billing.dto.request.CheckoutRequest;
import com.launchly.billing.entity.Plan;
import com.launchly.billing.entity.Subscription;
import com.launchly.billing.repository.PlanRepository;
import com.launchly.billing.repository.SubscriptionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

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
    @DisplayName("Should fetch all available plans seeded by Liquibase migrations")
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
    @DisplayName("Should retrieve active subscription and auto-create FREE tier if none exists")
    void getSubscription_Success() throws Exception {
        User user = createTestUser("subuser", Role.ROLE_OWNER);

        mockMvc.perform(get("/api/v1/billing/subscription")
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plan.name").isNotEmpty());

        Subscription sub = subscriptionRepository.findByUserId(user.getId()).orElse(null);
        assertThat(sub).isNotNull();
    }

    @Test
    @DisplayName("Should reject checkout for free tier plan with bad request")
    void checkout_FreePlan_ReturnsBadRequest() throws Exception {
        User user = createTestUser("freecheckout", Role.ROLE_OWNER);
        Plan freePlan = planRepository.findByName("FREE")
                .orElseThrow();

        CheckoutRequest request = new CheckoutRequest(freePlan.getId());

        mockMvc.perform(post("/api/v1/billing/subscription/checkout")
                        .header("Authorization", getAuthHeader(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should reject subscription cancellation when no active subscription exists")
    void cancelSubscription_NoSubscription_ReturnsClientError() throws Exception {
        User user = createTestUser("nosub", Role.ROLE_OWNER);

        mockMvc.perform(post("/api/v1/billing/subscription/cancel")
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().is4xxClientError());
    }
}
