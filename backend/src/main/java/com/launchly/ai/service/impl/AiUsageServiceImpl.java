package com.launchly.ai.service.impl;

import com.launchly.ai.entity.AiUsage;
import com.launchly.ai.repository.AiUsageRepository;
import com.launchly.ai.service.AiUsageService;
import com.launchly.auth.entity.User;
import com.launchly.auth.repository.UserRepository;
import com.launchly.billing.entity.Plan;
import com.launchly.billing.service.PlanLimitService;
import com.launchly.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Duration;
import java.time.LocalDate;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiUsageServiceImpl implements AiUsageService {

    private final AiUsageRepository aiUsageRepository;
    private final UserRepository userRepository;
    private final PlanLimitService planLimitService;
    private final StringRedisTemplate redisTemplate;

    private static final String REDIS_KEY_PREFIX = "launchly:ai:usage:";
    private static final int DAILY_LIMIT = 20;

    private String getRedisKey(Long userId, LocalDate date) {
        return REDIS_KEY_PREFIX + userId + ":" + date;
    }

    @Override
    @Transactional
    public int checkUsageLimit(Long userId) {
        Plan plan = planLimitService.getActivePlan(userId);
        LocalDate today = LocalDate.now();
        String redisKey = getRedisKey(userId, today);

        String cachedCountStr = redisTemplate.opsForValue().get(redisKey);
        int currentCount;

        if (cachedCountStr != null) {
            currentCount = Integer.parseInt(cachedCountStr);
        } else {
            Optional<AiUsage> aiUsageOpt = aiUsageRepository.findByUserIdAndDate(userId, today);
            if (aiUsageOpt.isPresent()) {
                currentCount = aiUsageOpt.get().getRequestCount();
            } else {
                currentCount = 0;
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));
                AiUsage newUsage = AiUsage.builder()
                        .user(user)
                        .date(today)
                        .requestCount(0)
                        .build();
                aiUsageRepository.save(newUsage);
            }
            redisTemplate.opsForValue().set(redisKey, String.valueOf(currentCount), Duration.ofHours(25));
        }

        if ("FREE".equalsIgnoreCase(plan.getName()) && currentCount >= DAILY_LIMIT) {
            throw new AppException(HttpStatus.PAYMENT_REQUIRED, "Daily AI limit reached");
        }

        return currentCount;
    }

    @Override
    @Transactional
    public void incrementUsage(Long userId) {
        LocalDate today = LocalDate.now();
        String redisKey = getRedisKey(userId, today);
        redisTemplate.opsForValue().increment(redisKey);

        AiUsage aiUsage = aiUsageRepository.findByUserIdAndDate(userId, today)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));
                    return AiUsage.builder()
                            .user(user)
                            .date(today)
                            .requestCount(0)
                            .build();
                });

        aiUsage.setRequestCount(aiUsage.getRequestCount() + 1);
        aiUsageRepository.save(aiUsage);
    }

    @Override
    @Transactional(readOnly = true)
    public int getCurrentUsage(Long userId) {
        LocalDate today = LocalDate.now();
        String redisKey = getRedisKey(userId, today);
        String cachedCountStr = redisTemplate.opsForValue().get(redisKey);
        if (cachedCountStr != null) {
            return Integer.parseInt(cachedCountStr);
        }
        return aiUsageRepository.findByUserIdAndDate(userId, today)
                .map(AiUsage::getRequestCount)
                .orElse(0);
    }
}
