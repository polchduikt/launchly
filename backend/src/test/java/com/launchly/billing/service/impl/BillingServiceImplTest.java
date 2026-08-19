package com.launchly.billing.service.impl;

import com.launchly.auth.entity.User;
import com.launchly.auth.service.UserQueryService;
import com.launchly.billing.dto.response.PlanResponse;
import com.launchly.billing.dto.response.SubscriptionResponse;
import com.launchly.billing.entity.Plan;
import com.launchly.billing.entity.Subscription;
import com.launchly.billing.entity.SubscriptionStatus;
import com.launchly.billing.mapper.BillingMapper;
import com.launchly.billing.repository.PlanRepository;
import com.launchly.billing.repository.SubscriptionRepository;
import com.launchly.billing.service.PlanLimitService;
import com.launchly.common.exception.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.CacheManager;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BillingServiceImplTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private PlanRepository planRepository;

    @Mock
    private UserQueryService userQueryService;

    @Mock
    private BillingMapper billingMapper;

    @Mock
    private CacheManager cacheManager;

    @Mock
    private PlanLimitService planLimitService;

    @InjectMocks
    private BillingServiceImpl billingService;

    private User testUser;
    private Plan freePlan;
    private Plan proPlan;
    private Subscription testSubscription;
    private SubscriptionResponse mockSubscriptionResponse;

    @BeforeEach
    void setUp() {
        testUser = User.builder().email("billing@launchly.pro").name("Billing User").build();
        ReflectionTestUtils.setField(testUser, "id", 1L);

        freePlan = Plan.builder().name("FREE").price(BigDecimal.ZERO).active(true).build();
        ReflectionTestUtils.setField(freePlan, "id", 10L);

        proPlan = Plan.builder().name("PRO").price(new BigDecimal("29.00")).active(true).build();
        ReflectionTestUtils.setField(proPlan, "id", 20L);

        testSubscription = Subscription.builder()
                .status(SubscriptionStatus.ACTIVE)
                .plan(freePlan)
                .user(testUser)
                .build();
        ReflectionTestUtils.setField(testSubscription, "id", 100L);

        mockSubscriptionResponse = mock(SubscriptionResponse.class);
    }

    @Test
    @DisplayName("Should create free subscription for new user")
    void createFreeSubscription_Success() {
        when(subscriptionRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(userQueryService.getUserOrThrow(1L)).thenReturn(testUser);
        when(planRepository.findByName("FREE")).thenReturn(Optional.of(freePlan));

        billingService.createFreeSubscription(1L);

        verify(subscriptionRepository, times(1)).save(any(Subscription.class));
    }

    @Test
    @DisplayName("Should skip creating subscription if user already has one")
    void createFreeSubscription_WhenAlreadyExists_SkipsSaving() {
        when(subscriptionRepository.findByUserId(1L)).thenReturn(Optional.of(testSubscription));

        billingService.createFreeSubscription(1L);

        verify(subscriptionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should return available active plans")
    void getAvailablePlans_ReturnsActiveOnly() {
        Plan inactivePlan = Plan.builder().name("LEGACY").active(false).build();
        when(planRepository.findAll()).thenReturn(List.of(freePlan, proPlan, inactivePlan));
        when(billingMapper.toPlanResponseList(List.of(freePlan, proPlan)))
                .thenReturn(List.of(mock(PlanResponse.class), mock(PlanResponse.class)));

        List<PlanResponse> plans = billingService.getAvailablePlans();

        assertThat(plans).hasSize(2);
    }

    @Test
    @DisplayName("Should get user subscription details")
    void getSubscriptionByUser_Success() {
        when(subscriptionRepository.findByUserId(1L)).thenReturn(Optional.of(testSubscription));
        when(billingMapper.toSubscriptionResponse(testSubscription)).thenReturn(mockSubscriptionResponse);

        SubscriptionResponse response = billingService.getSubscriptionByUser(1L);

        assertThat(response).isNotNull();
    }

    @Test
    @DisplayName("Should throw BadRequest when creating checkout session for FREE plan")
    void createCheckoutSession_WhenFreePlan_ThrowsBadRequest() {
        when(userQueryService.getUserOrThrow(1L)).thenReturn(testUser);
        when(planLimitService.getPlan(10L)).thenReturn(freePlan);

        assertThatThrownBy(() -> billingService.createCheckoutSession(10L, 1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Should throw NotFound when cancelling non-existent subscription")
    void cancelSubscription_WhenNotFound_ThrowsNotFound() {
        when(subscriptionRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> billingService.cancelSubscription(1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("Should throw BadRequest when cancelling subscription without stripe ID")
    void cancelSubscription_WhenNoStripeId_ThrowsBadRequest() {
        when(subscriptionRepository.findByUserId(1L)).thenReturn(Optional.of(testSubscription));

        assertThatThrownBy(() -> billingService.cancelSubscription(1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Should throw NotFound when resuming non-existent subscription")
    void resumeSubscription_WhenNotFound_ThrowsNotFound() {
        when(subscriptionRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> billingService.resumeSubscription(1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("Should throw BadRequest when resuming subscription without stripe ID")
    void resumeSubscription_WhenNoStripeId_ThrowsBadRequest() {
        when(subscriptionRepository.findByUserId(1L)).thenReturn(Optional.of(testSubscription));

        assertThatThrownBy(() -> billingService.resumeSubscription(1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }
}
