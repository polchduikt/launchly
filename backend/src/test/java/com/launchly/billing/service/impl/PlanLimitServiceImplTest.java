package com.launchly.billing.service.impl;

import com.launchly.billing.entity.Plan;
import com.launchly.billing.entity.Subscription;
import com.launchly.billing.entity.SubscriptionStatus;
import com.launchly.billing.repository.PlanRepository;
import com.launchly.billing.repository.SubscriptionRepository;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.common.exception.AppException;
import com.launchly.common.utils.EncryptionUtil;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlanLimitServiceImplTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private PlanRepository planRepository;

    @Mock
    private BotRepository botRepository;

    @Mock
    private BotUserRepository botUserRepository;

    @Mock
    private EncryptionUtil encryptionUtil;

    @Mock
    private com.launchly.auth.repository.UserRepository userRepository;

    @InjectMocks
    private PlanLimitServiceImpl planLimitService;

    private Plan freePlan;
    private Plan proPlan;

    @BeforeEach
    void setUp() {
        freePlan = Plan.builder()
                .name("FREE")
                .maxBots(1)
                .maxBotUsers(100)
                .canUseIntegrations(false)
                .canUseAiAgent(false)
                .build();
        ReflectionTestUtils.setField(freePlan, "id", 1L);

        proPlan = Plan.builder()
                .name("PRO")
                .maxBots(5)
                .maxBotUsers(5000)
                .canUseIntegrations(true)
                .canUseAiAgent(true)
                .build();
        ReflectionTestUtils.setField(proPlan, "id", 2L);
    }

    @Test
    @DisplayName("Should return active subscription plan when active")
    void getActivePlan_WhenActiveSubscription_ReturnsPlan() {
        Subscription sub = Subscription.builder()
                .status(SubscriptionStatus.ACTIVE)
                .plan(proPlan)
                .build();

        when(subscriptionRepository.findByUserId(1L)).thenReturn(Optional.of(sub));

        Plan result = planLimitService.getActivePlan(1L);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("PRO");
    }

    @Test
    @DisplayName("Should fallback to FREE plan when no subscription exists")
    void getActivePlan_WhenNoSubscription_ReturnsFreePlan() {
        when(subscriptionRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(planRepository.findByName("FREE")).thenReturn(Optional.of(freePlan));

        Plan result = planLimitService.getActivePlan(1L);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("FREE");
    }

    @Test
    @DisplayName("Should throw PaymentRequired exception when bot limit is exceeded")
    void checkBotLimit_WhenLimitReached_ThrowsPaymentRequired() {
        Subscription sub = Subscription.builder().status(SubscriptionStatus.ACTIVE).plan(freePlan).build();
        when(subscriptionRepository.findByUserId(1L)).thenReturn(Optional.of(sub));

        Bot existingBot = Bot.builder().telegramToken("enc_tok_1").build();
        when(botRepository.findAllByUserId(1L)).thenReturn(List.of(existingBot));
        when(encryptionUtil.decrypt("enc_tok_1")).thenReturn("1111:token");

        assertThatThrownBy(() -> planLimitService.checkBotLimit(1L, "2222:newtoken"))
                .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("Should throw PaymentRequired exception when integration is not available in plan")
    void checkIntegrationAccess_WhenNotAllowed_ThrowsPaymentRequired() {
        Subscription sub = Subscription.builder().status(SubscriptionStatus.ACTIVE).plan(freePlan).build();
        when(subscriptionRepository.findByUserId(1L)).thenReturn(Optional.of(sub));

        assertThatThrownBy(() -> planLimitService.checkIntegrationAccess(1L))
                .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("Should pass integration access check when plan allows integrations")
    void checkIntegrationAccess_WhenAllowed_PassesSuccessfully() {
        Subscription sub = Subscription.builder().status(SubscriptionStatus.ACTIVE).plan(proPlan).build();
        when(subscriptionRepository.findByUserId(1L)).thenReturn(Optional.of(sub));

        planLimitService.checkIntegrationAccess(1L);
    }
}
