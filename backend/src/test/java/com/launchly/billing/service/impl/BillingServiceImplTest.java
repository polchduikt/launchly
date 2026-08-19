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
import org.springframework.test.util.ReflectionTestUtils;

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
    private PlanLimitService planLimitService;

    @InjectMocks
    private BillingServiceImpl billingService;

    private User testUser;
    private Plan freePlan;
    private Plan proPlan;

    @BeforeEach
    void setUp() {
        testUser = User.builder().email("user@test.com").name("User").build();
        ReflectionTestUtils.setField(testUser, "id", 1L);

        freePlan = Plan.builder().name("FREE").active(true).build();
        ReflectionTestUtils.setField(freePlan, "id", 1L);

        proPlan = Plan.builder().name("PRO").active(true).build();
        ReflectionTestUtils.setField(proPlan, "id", 2L);
    }

    @Test
    @DisplayName("Should create free subscription for user")
    void createFreeSubscription_Success() {
        when(userQueryService.getUserOrThrow(1L)).thenReturn(testUser);
        when(planRepository.findByName("FREE")).thenReturn(Optional.of(freePlan));

        billingService.createFreeSubscription(1L);

        verify(subscriptionRepository, times(1)).save(any(Subscription.class));
    }

    @Test
    @DisplayName("Should return available active plans")
    void getAvailablePlans_ReturnsActivePlans() {
        when(planRepository.findAll()).thenReturn(List.of(freePlan, proPlan));
        when(billingMapper.toPlanResponseList(any())).thenReturn(List.of(
                mock(PlanResponse.class),
                mock(PlanResponse.class)
        ));

        List<PlanResponse> plans = billingService.getAvailablePlans();

        assertThat(plans).hasSize(2);
    }

    @Test
    @DisplayName("Should return subscription for user")
    void getSubscriptionByUser_WhenExists_ReturnsSubscription() {
        Subscription sub = Subscription.builder().user(testUser).plan(proPlan).status(SubscriptionStatus.ACTIVE).build();
        SubscriptionResponse mockResponse = mock(SubscriptionResponse.class);

        when(subscriptionRepository.findByUserId(1L)).thenReturn(Optional.of(sub));
        when(billingMapper.toSubscriptionResponse(sub)).thenReturn(mockResponse);

        SubscriptionResponse result = billingService.getSubscriptionByUser(1L);

        assertThat(result).isNotNull();
        verify(subscriptionRepository, times(1)).findByUserId(1L);
    }

    @Test
    @DisplayName("Should throw bad request when creating checkout session for FREE plan")
    void createCheckoutSession_WhenFreePlan_ThrowsBadRequest() {
        when(userQueryService.getUserOrThrow(1L)).thenReturn(testUser);
        when(planLimitService.getPlan(1L)).thenReturn(freePlan);

        assertThatThrownBy(() -> billingService.createCheckoutSession(1L, 1L))
                .isInstanceOf(AppException.class);
    }
}
