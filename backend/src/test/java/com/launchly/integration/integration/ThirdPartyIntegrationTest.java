package com.launchly.integration.integration;

import com.launchly.BaseIntegrationTest;
import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import com.launchly.billing.entity.Plan;
import com.launchly.billing.entity.Subscription;
import com.launchly.billing.entity.SubscriptionStatus;
import com.launchly.billing.repository.PlanRepository;
import com.launchly.billing.repository.SubscriptionRepository;
import com.launchly.bot.entity.Bot;
import com.launchly.integration.dto.request.IntegrationCreateRequest;
import com.launchly.integration.entity.Integration;
import com.launchly.integration.entity.IntegrationType;
import com.launchly.integration.repository.IntegrationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ThirdPartyIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private IntegrationRepository integrationRepository;

    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Test
    @DisplayName("Should create integration for user with Pro subscription, persist in DB, and list integrations")
    void createAndListIntegrations_Success() throws Exception {
        User user = createTestUser("integuser", Role.ROLE_OWNER);
        Bot bot = createTestBot(user, "Webhook Bot");

        Plan proPlan = planRepository.findByName("PRO")
                .or(() -> planRepository.findAll().stream().filter(Plan::isCanUseIntegrations).findFirst())
                .orElseThrow();

        Subscription subscription = Subscription.builder()
                .user(user)
                .plan(proPlan)
                .status(SubscriptionStatus.ACTIVE)
                .build();
        subscriptionRepository.save(subscription);

        IntegrationCreateRequest request = new IntegrationCreateRequest(
                "Order Webhook",
                IntegrationType.WEBHOOK,
                bot.getId(),
                Map.of(
                        "url", "https://api.external.com/webhook",
                        "events", List.of("ORDER_CREATED"),
                        "secret", "sec_123"
                )
        );

        String responseContent = mockMvc.perform(post("/api/v1/integrations")
                        .header("Authorization", getAuthHeader(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Order Webhook"))
                .andReturn().getResponse().getContentAsString();

        Long integrationId = objectMapper.readTree(responseContent).get("id").asLong();

        List<Integration> inDb = integrationRepository.findAllByBotId(bot.getId());
        assertThat(inDb).hasSize(1);
        assertThat(inDb.get(0).getName()).isEqualTo("Order Webhook");

        mockMvc.perform(get("/api/v1/integrations")
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Order Webhook"));

        mockMvc.perform(delete("/api/v1/integrations/" + integrationId)
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().isNoContent());

        assertThat(integrationRepository.findById(integrationId)).isEmpty();
    }

    @Test
    @DisplayName("Should reject integration creation for user on free plan")
    void createIntegration_FreePlan_ReturnsPaymentRequired() throws Exception {
        User user = createTestUser("freeinteg", Role.ROLE_OWNER);
        Bot bot = createTestBot(user, "Free Webhook Bot");

        IntegrationCreateRequest request = new IntegrationCreateRequest(
                "Blocked Webhook",
                IntegrationType.WEBHOOK,
                bot.getId(),
                Map.of("url", "https://api.external.com/webhook")
        );

        mockMvc.perform(post("/api/v1/integrations")
                        .header("Authorization", getAuthHeader(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isPaymentRequired());
    }
}
