package com.launchly.ai.service.impl;

import com.launchly.ai.entity.AiUsage;
import com.launchly.ai.repository.AiUsageRepository;
import com.launchly.auth.service.UserQueryService;
import com.launchly.billing.entity.Plan;
import com.launchly.common.exception.AppException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiUsageServiceImplTest {

    @Mock
    private AiUsageRepository aiUsageRepository;

    @Mock
    private UserQueryService userQueryService;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private AiUsageServiceImpl aiUsageService;

    @Test
    @DisplayName("Should return correct token limit per subscription plan")
    void getPlanTokenLimit_VariousPlans_ReturnsLimits() {
        Plan freePlan = Plan.builder().name("FREE").build();
        Plan starterPlan = Plan.builder().name("STARTER").build();
        Plan proPlan = Plan.builder().name("PRO").build();
        Plan businessPlan = Plan.builder().name("BUSINESS").build();

        assertThat(AiUsageServiceImpl.getPlanTokenLimit(freePlan)).isEqualTo(20000L);
        assertThat(AiUsageServiceImpl.getPlanTokenLimit(starterPlan)).isEqualTo(50000L);
        assertThat(AiUsageServiceImpl.getPlanTokenLimit(proPlan)).isEqualTo(120000L);
        assertThat(AiUsageServiceImpl.getPlanTokenLimit(businessPlan)).isEqualTo(250000L);
    }

    @Test
    @DisplayName("Should pass token limit check when daily usage is under threshold")
    void checkTokenLimit_WhenUnderLimit_Passes() {
        Plan proPlan = Plan.builder().name("PRO").build();
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn("50000");

        aiUsageService.checkTokenLimit(1L, proPlan);
    }

    @Test
    @DisplayName("Should throw PaymentRequired exception when AI token limit is reached")
    void checkTokenLimit_WhenLimitReached_ThrowsPaymentRequired() {
        Plan freePlan = Plan.builder().name("FREE").build();
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn("25000");

        assertThatThrownBy(() -> aiUsageService.checkTokenLimit(1L, freePlan))
                .isInstanceOf(AppException.class);
    }
}
