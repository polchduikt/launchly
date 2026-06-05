package com.launchly.billing.service;

import com.launchly.auth.entity.User;
import com.launchly.auth.repository.UserRepository;
import com.launchly.billing.dto.response.PlanResponse;
import com.launchly.billing.dto.response.SubscriptionResponse;
import com.launchly.billing.entity.Plan;
import com.launchly.billing.entity.Subscription;
import com.launchly.billing.mapper.BillingMapper;
import com.launchly.billing.repository.PlanRepository;
import com.launchly.billing.repository.SubscriptionRepository;
import com.launchly.billing.service.impl.BillingServiceImpl;
import com.launchly.common.exception.AppException;
import com.stripe.net.Webhook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BillingServiceTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private PlanRepository planRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BillingMapper billingMapper;

    @InjectMocks
    private BillingServiceImpl billingService;

    private User user;
    private Plan freePlan;
    private Plan starterPlan;

    @BeforeEach
    void setUp() {
        user = User.builder().email("owner@test.com").name("Owner").build();
        user.setId(1L);

        freePlan = Plan.builder().name("FREE").active(true).build();
        freePlan.setId(10L);

        starterPlan = Plan.builder().name("STARTER").active(true).stripePriceId("price_starter").build();
        starterPlan.setId(11L);

        ReflectionTestUtils.setField(billingService, "webhookSecret", "whsec_test");
    }

    @Test
    void createFreeSubscription_WhenNewUser_ShouldSaveSubscription() {
        when(subscriptionRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(planRepository.findByName("FREE")).thenReturn(Optional.of(freePlan));

        billingService.createFreeSubscription(1L);

        verify(subscriptionRepository, times(1)).save(any(Subscription.class));
    }

    @Test
    void createFreeSubscription_WhenUserHasSub_ShouldNotSave() {
        Subscription sub = new Subscription();
        when(subscriptionRepository.findByUserId(1L)).thenReturn(Optional.of(sub));

        billingService.createFreeSubscription(1L);

        verify(subscriptionRepository, never()).save(any());
    }

    @Test
    void getSubscriptionByUser_WhenUserHasSub_ShouldReturnResponse() {
        Subscription sub = new Subscription();
        PlanResponse planResponse = new PlanResponse(10L, "FREE", "Free Plan", BigDecimal.ZERO, "USD", 1, 100, 0, false, false, false, false);
        SubscriptionResponse response = new SubscriptionResponse(1L, "ACTIVE", false, null, null, planResponse);

        when(subscriptionRepository.findByUserId(1L)).thenReturn(Optional.of(sub));
        when(billingMapper.toSubscriptionResponse(sub)).thenReturn(response);

        SubscriptionResponse result = billingService.getSubscriptionByUser(1L);

        assertNotNull(result);
        assertEquals("FREE", result.plan().name());
    }

    @Test
    void handleStripeWebhook_WithInvalidSignature_ShouldThrowAppException() {
        try (MockedStatic<Webhook> webhookMockedStatic = mockStatic(Webhook.class)) {
            webhookMockedStatic.when(() -> Webhook.constructEvent(anyString(), anyString(), anyString()))
                    .thenThrow(new RuntimeException("Invalid signature"));

            AppException ex = assertThrows(AppException.class, () ->
                    billingService.handleStripeWebhook("payload", "sigHeader")
            );

            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        }
    }
}
