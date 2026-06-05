package com.launchly.billing.service;

import com.launchly.billing.entity.Plan;
import com.launchly.billing.entity.Subscription;
import com.launchly.billing.entity.SubscriptionStatus;
import com.launchly.billing.repository.PlanRepository;
import com.launchly.billing.repository.SubscriptionRepository;
import com.launchly.billing.service.impl.PlanLimitServiceImpl;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.broadcast.entity.CampaignStatus;
import com.launchly.broadcast.repository.BroadcastCampaignRepository;
import com.launchly.common.exception.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlanLimitServiceTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private PlanRepository planRepository;

    @Mock
    private BotRepository botRepository;

    @Mock
    private BotUserRepository botUserRepository;

    @Mock
    private BroadcastCampaignRepository broadcastCampaignRepository;

    @InjectMocks
    private PlanLimitServiceImpl planLimitService;

    private Plan freePlan;
    private Plan starterPlan;
    private Subscription activeFreeSub;

    @BeforeEach
    void setUp() {
        freePlan = Plan.builder()
                .name("FREE")
                .maxBots(1)
                .maxBotUsers(100)
                .maxBroadcastsPerMonth(0)
                .canUseBroadcast(false)
                .canUseIntegrations(false)
                .canUseAiAgent(false)
                .build();

        starterPlan = Plan.builder()
                .name("STARTER")
                .maxBots(3)
                .maxBotUsers(1000)
                .maxBroadcastsPerMonth(10)
                .canUseBroadcast(true)
                .canUseIntegrations(true)
                .canUseAiAgent(true)
                .build();

        activeFreeSub = Subscription.builder()
                .status(SubscriptionStatus.ACTIVE)
                .plan(freePlan)
                .build();
    }

    @Test
    void checkBotLimit_WhenWithinLimit_ShouldPass() {
        Long userId = 1L;
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(activeFreeSub));
        when(botRepository.countByUserId(userId)).thenReturn(0L);

        assertDoesNotThrow(() -> planLimitService.checkBotLimit(userId));
    }

    @Test
    void checkBotLimit_WhenLimitExceeded_ShouldThrowPaymentRequired() {
        Long userId = 1L;
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(activeFreeSub));
        when(botRepository.countByUserId(userId)).thenReturn(1L);

        AppException exception = assertThrows(AppException.class, () -> planLimitService.checkBotLimit(userId));
        assertEquals(HttpStatus.PAYMENT_REQUIRED, exception.getStatus());
        assertTrue(exception.getMessage().contains("Bot limit reached"));
    }

    @Test
    void checkBotUserLimit_WhenWithinLimit_ShouldPass() {
        Long botId = 10L;
        Long userId = 1L;
        Bot bot = Bot.builder().build();
        bot.setId(botId);
        com.launchly.auth.entity.User testUser = com.launchly.auth.entity.User.builder().build();
        testUser.setId(userId);
        bot.setUser(testUser);

        when(botRepository.findById(botId)).thenReturn(Optional.of(bot));
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(activeFreeSub));
        when(botUserRepository.countByBotId(botId)).thenReturn(50L);

        assertDoesNotThrow(() -> planLimitService.checkBotUserLimit(botId));
    }

    @Test
    void checkBotUserLimit_WhenLimitExceeded_ShouldThrowPaymentRequired() {
        Long botId = 10L;
        Long userId = 1L;
        Bot bot = Bot.builder().build();
        bot.setId(botId);
        com.launchly.auth.entity.User testUser = com.launchly.auth.entity.User.builder().build();
        testUser.setId(userId);
        bot.setUser(testUser);

        when(botRepository.findById(botId)).thenReturn(Optional.of(bot));
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(activeFreeSub));
        when(botUserRepository.countByBotId(botId)).thenReturn(100L);

        AppException exception = assertThrows(AppException.class, () -> planLimitService.checkBotUserLimit(botId));
        assertEquals(HttpStatus.PAYMENT_REQUIRED, exception.getStatus());
        assertTrue(exception.getMessage().contains("Bot user limit reached"));
    }

    @Test
    void checkBroadcastAccess_WhenNotAllowedByPlan_ShouldThrowPaymentRequired() {
        Long userId = 1L;
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(activeFreeSub));

        AppException exception = assertThrows(AppException.class, () -> planLimitService.checkBroadcastAccess(userId));
        assertEquals(HttpStatus.PAYMENT_REQUIRED, exception.getStatus());
        assertTrue(exception.getMessage().contains("Broadcast feature is not available"));
    }

    @Test
    void checkBroadcastAccess_WhenAllowedAndWithinLimit_ShouldPass() {
        Long userId = 1L;
        Subscription activeStarterSub = Subscription.builder()
                .status(SubscriptionStatus.ACTIVE)
                .plan(starterPlan)
                .build();

        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(activeStarterSub));
        when(broadcastCampaignRepository.countCampaignsSentThisMonth(eq(userId), eq(CampaignStatus.COMPLETED), any(LocalDateTime.class)))
                .thenReturn(5L);

        assertDoesNotThrow(() -> planLimitService.checkBroadcastAccess(userId));
    }

    @Test
    void checkBroadcastAccess_WhenAllowedAndLimitExceeded_ShouldThrowPaymentRequired() {
        Long userId = 1L;
        Subscription activeStarterSub = Subscription.builder()
                .status(SubscriptionStatus.ACTIVE)
                .plan(starterPlan)
                .build();

        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(activeStarterSub));
        when(broadcastCampaignRepository.countCampaignsSentThisMonth(eq(userId), eq(CampaignStatus.COMPLETED), any(LocalDateTime.class)))
                .thenReturn(10L);

        AppException exception = assertThrows(AppException.class, () -> planLimitService.checkBroadcastAccess(userId));
        assertEquals(HttpStatus.PAYMENT_REQUIRED, exception.getStatus());
        assertTrue(exception.getMessage().contains("Monthly broadcast limit reached"));
    }

    @Test
    void checkIntegrationAccess_WhenNotAllowed_ShouldThrowPaymentRequired() {
        Long userId = 1L;
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(activeFreeSub));

        AppException exception = assertThrows(AppException.class, () -> planLimitService.checkIntegrationAccess(userId));
        assertEquals(HttpStatus.PAYMENT_REQUIRED, exception.getStatus());
    }

    @Test
    void checkAiAccess_WhenNotAllowed_ShouldThrowPaymentRequired() {
        Long userId = 1L;
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(activeFreeSub));

        AppException exception = assertThrows(AppException.class, () -> planLimitService.checkAiAccess(userId));
        assertEquals(HttpStatus.PAYMENT_REQUIRED, exception.getStatus());
    }
}
