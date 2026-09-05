package com.launchly.billing.service.impl;

import com.launchly.bot.constant.BotConstants;
import com.launchly.bot.entity.Bot;
import com.launchly.common.utils.EncryptionUtil;
import com.launchly.billing.entity.Plan;
import org.hibernate.Hibernate;
import com.launchly.billing.entity.Subscription;
import com.launchly.billing.entity.SubscriptionStatus;
import com.launchly.billing.repository.PlanRepository;
import com.launchly.billing.repository.SubscriptionRepository;
import com.launchly.billing.service.PlanLimitService;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.broadcast.repository.BroadcastCampaignRepository;
import com.launchly.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import com.launchly.auth.entity.Role;
import com.launchly.auth.repository.UserRepository;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlanLimitServiceImpl implements PlanLimitService {

    private final SubscriptionRepository subscriptionRepository;
    private final PlanRepository planRepository;
    private final BotRepository botRepository;
    private final BotUserRepository botUserRepository;
    private final BroadcastCampaignRepository broadcastCampaignRepository;
    private final EncryptionUtil encryptionUtil;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public void checkBotLimit(Long userId, String newTelegramToken) {
        Plan plan = getActivePlan(userId);
        
        List<Bot> userBots = botRepository.findAllByUserId(userId);
        boolean tokenAlreadyExists = false;
        if (newTelegramToken != null && !BotConstants.DUMMY_TOKEN_PLACEHOLDER.equals(newTelegramToken)) {
            for (Bot b : userBots) {
                try {
                    String decrypted = encryptionUtil.decrypt(b.getTelegramToken());
                    if (newTelegramToken.equals(decrypted)) {
                        tokenAlreadyExists = true;
                        break;
                    }
                } catch (Exception e) {
                    log.warn("Failed to decrypt token for bot id={}: {}", b.getId(), e.getMessage());
                }
            }
        }

        if (tokenAlreadyExists) {
            return;
        }
        long distinctRealTokensCount = userBots.stream()
                .map(b -> {
                    try {
                        return encryptionUtil.decrypt(b.getTelegramToken());
                    } catch (Exception e) {
                        return b.getTelegramToken();
                    }
                })
                .filter(token -> !BotConstants.DUMMY_TOKEN_PLACEHOLDER.equals(token))
                .distinct()
                .count();

        if (distinctRealTokensCount >= plan.getMaxBots()) {
            throw new AppException(HttpStatus.PAYMENT_REQUIRED, "billing.error.bot_limit_reached");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public void checkBotUserLimit(Long botId) {
        var bot = botRepository.findById(botId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "bot.error.not_found"));
        Long userId = bot.getUser().getId();
        Plan plan = getActivePlan(userId);
        long currentUsers = botUserRepository.countByBotId(botId);
        if (currentUsers >= plan.getMaxBotUsers()) {
            throw new AppException(HttpStatus.PAYMENT_REQUIRED, "billing.error.user_limit_reached");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public void checkBroadcastAccess(Long userId) {
    }

    @Override
    @Transactional(readOnly = true)
    public void checkIntegrationAccess(Long userId) {
        if (userRepository != null && userRepository.findById(userId).map(u -> u.getRole() == Role.ROLE_ADMIN).orElse(false)) {
            return;
        }
        Plan plan = getActivePlan(userId);
        if (!plan.isCanUseIntegrations()) {
            throw new AppException(HttpStatus.PAYMENT_REQUIRED, "billing.error.integration_not_available");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public void checkAiAccess(Long userId) {
        if (userRepository != null && userRepository.findById(userId).map(u -> u.getRole() == Role.ROLE_ADMIN).orElse(false)) {
            return;
        }
        Plan plan = getActivePlan(userId);
        if (!plan.isCanUseAiAgent()) {
            throw new AppException(HttpStatus.PAYMENT_REQUIRED, "billing.error.ai_not_available");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Plan getActivePlan(Long userId) {
        if (userRepository != null && userRepository.findById(userId).map(u -> u.getRole() == Role.ROLE_ADMIN).orElse(false)) {
            return (Plan) Hibernate.unproxy(planRepository.findByName("ENTERPRISE")
                    .orElseGet(() -> planRepository.findByName("FREE")
                            .orElseThrow(() -> new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Default FREE plan not found"))));
        }

        Plan plan = subscriptionRepository.findByUserId(userId)
                .filter(sub -> {
                    if (sub.getStatus() == SubscriptionStatus.ACTIVE || sub.getStatus() == SubscriptionStatus.TRIALING) {
                        return true;
                    }
                    if (sub.getStatus() == SubscriptionStatus.CANCELLED && sub.isCancelAtPeriodEnd() && sub.getCurrentPeriodEnd() != null) {
                        return sub.getCurrentPeriodEnd().isAfter(LocalDateTime.now());
                    }
                    return false;
                })
                .map(Subscription::getPlan)
                .orElseGet(() -> planRepository.findByName("FREE")
                        .orElseThrow(() -> new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Default FREE plan not found")));
        return (Plan) Hibernate.unproxy(plan);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "plan", key = "#planId")
    public Plan getPlan(Long planId) {
        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Plan not found"));
        return (Plan) Hibernate.unproxy(plan);
    }
}
