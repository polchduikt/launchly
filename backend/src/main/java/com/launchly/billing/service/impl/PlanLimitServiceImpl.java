package com.launchly.billing.service.impl;

import com.launchly.billing.entity.Plan;
import com.launchly.billing.entity.Subscription;
import com.launchly.billing.entity.SubscriptionStatus;
import com.launchly.billing.repository.PlanRepository;
import com.launchly.billing.repository.SubscriptionRepository;
import com.launchly.billing.service.PlanLimitService;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.broadcast.entity.CampaignStatus;
import com.launchly.broadcast.repository.BroadcastCampaignRepository;
import com.launchly.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PlanLimitServiceImpl implements PlanLimitService {

    private final SubscriptionRepository subscriptionRepository;
    private final PlanRepository planRepository;
    private final BotRepository botRepository;
    private final BotUserRepository botUserRepository;
    private final BroadcastCampaignRepository broadcastCampaignRepository;

    @Override
    @Transactional(readOnly = true)
    public void checkBotLimit(Long userId) {
        Plan plan = getActivePlan(userId);
        long currentBots = botRepository.countByUserId(userId);
        if (currentBots >= plan.getMaxBots()) {
            throw new AppException(HttpStatus.PAYMENT_REQUIRED, "Bot limit reached. Upgrade your plan.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public void checkBotUserLimit(Long botId) {
        var bot = botRepository.findById(botId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bot not found"));
        Long userId = bot.getUser().getId();
        Plan plan = getActivePlan(userId);
        long currentUsers = botUserRepository.countByBotId(botId);
        if (currentUsers >= plan.getMaxBotUsers()) {
            throw new AppException(HttpStatus.PAYMENT_REQUIRED, "Bot user limit reached. Upgrade your plan.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public void checkBroadcastAccess(Long userId) {
        Plan plan = getActivePlan(userId);
        if (!plan.isCanUseBroadcast()) {
            throw new AppException(HttpStatus.PAYMENT_REQUIRED, "Broadcast feature is not available in your plan. Upgrade your plan.");
        }
        
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        long sentThisMonth = broadcastCampaignRepository.countCampaignsSentThisMonth(userId, CampaignStatus.COMPLETED, startOfMonth);
        if (sentThisMonth >= plan.getMaxBroadcastsPerMonth()) {
            throw new AppException(HttpStatus.PAYMENT_REQUIRED, "Monthly broadcast limit reached. Upgrade your plan.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public void checkIntegrationAccess(Long userId) {
        Plan plan = getActivePlan(userId);
        if (!plan.isCanUseIntegrations()) {
            throw new AppException(HttpStatus.PAYMENT_REQUIRED, "Integrations feature is not available in your plan. Upgrade your plan.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public void checkAiAccess(Long userId) {
        Plan plan = getActivePlan(userId);
        if (!plan.isCanUseAiAgent()) {
            throw new AppException(HttpStatus.PAYMENT_REQUIRED, "AI Agent feature is not available in your plan. Upgrade your plan.");
        }
    }

    @Override
    public Plan getActivePlan(Long userId) {
        return subscriptionRepository.findByUserId(userId)
                .filter(sub -> sub.getStatus() == SubscriptionStatus.ACTIVE || sub.getStatus() == SubscriptionStatus.TRIALING)
                .map(Subscription::getPlan)
                .orElseGet(() -> planRepository.findByName("FREE")
                        .orElseThrow(() -> new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Default FREE plan not found")));
    }
}
