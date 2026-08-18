package com.launchly.ai.service.impl;

import com.launchly.ai.dto.response.AiUsageResponse;
import com.launchly.ai.entity.AiUsage;
import com.launchly.ai.repository.AiUsageRepository;
import com.launchly.ai.service.AiUsageService;
import com.launchly.auth.entity.User;
import com.launchly.auth.service.UserQueryService;
import com.launchly.billing.entity.Plan;
import com.launchly.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Duration;
import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiUsageServiceImpl implements AiUsageService {

    private final AiUsageRepository aiUsageRepository;
    private final UserQueryService userQueryService;
    private final StringRedisTemplate redisTemplate;

    private static final String AI_TOKENS_KEY = "launchly:ai:tokens:%d:%s";
    private static final Duration AI_USAGE_TTL = Duration.ofHours(25);

    public static long getPlanTokenLimit(Plan plan) {
        if (plan == null || plan.getName() == null) return 20000L;
        String planName = plan.getName().trim().toUpperCase();
        return switch (planName) {
            case "FREE" -> 20000L;
            case "STARTER" -> 50000L;
            case "PRO" -> 120000L;
            case "BUSINESS" -> 250000L;
            default -> 20000L;
        };
    }

    @Override
    @Transactional(readOnly = true)
    public void checkTokenLimit(Long userId, Plan plan) {
        long limit = getPlanTokenLimit(plan);
        long used = getTokensUsedToday(userId);
        if (used >= limit) {
            throw new AppException(
                HttpStatus.PAYMENT_REQUIRED,
                "billing.error.ai_token_limit_reached"
            );
        }

    }

    @Override
    @Transactional
    public void recordTokenUsage(Long userId, Plan plan, int tokensConsumed) {
        if (tokensConsumed <= 0) {
            tokensConsumed = 1500;
        }
        
        String key = String.format(AI_TOKENS_KEY, userId, LocalDate.now());
        Long totalUsedInRedis = redisTemplate.opsForValue().increment(key, tokensConsumed);
        if (totalUsedInRedis != null && totalUsedInRedis == tokensConsumed) {
            redisTemplate.expire(key, AI_USAGE_TTL);
        }

        LocalDate today = LocalDate.now();
        AiUsage aiUsage = aiUsageRepository.findByUserIdAndDate(userId, today)
                .orElseGet(() -> {
                    User user = userQueryService.getUserOrThrow(userId);
                    return AiUsage.builder()
                            .user(user)
                            .date(today)
                            .requestCount(0)
                            .tokensUsed(0L)
                            .build();
                });
        aiUsage.setRequestCount(aiUsage.getRequestCount() + 1);
        aiUsage.setTokensUsed(totalUsedInRedis != null ? totalUsedInRedis : aiUsage.getTokensUsed() + tokensConsumed);
        aiUsageRepository.save(aiUsage);
    }

    @Override
    @Transactional(readOnly = true)
    public AiUsageResponse getUsage(Long userId, Plan plan) {
        long limit = getPlanTokenLimit(plan);
        long used = getTokensUsedToday(userId);
        long remaining = Math.max(0L, limit - used);
        int remainingPercentage = Math.max(0, Math.min(100, (int) Math.round((double) remaining / limit * 100)));

        return new AiUsageResponse(
            used,
            limit,
            remaining,
            remainingPercentage,
            LocalDate.now().plusDays(1).atStartOfDay().toString()
        );
    }

    private long getTokensUsedToday(Long userId) {
        String key = String.format(AI_TOKENS_KEY, userId, LocalDate.now());
        String value = redisTemplate.opsForValue().get(key);
        if (value != null) {
            try {
                return Long.parseLong(value);
            } catch (NumberFormatException e) {
                log.warn("Invalid token count in Redis for key {}: {}", key, value);
            }

        }
        long dbUsed = aiUsageRepository.findByUserIdAndDate(userId, LocalDate.now())
                .map(AiUsage::getTokensUsed)
                .orElse(0L);
        redisTemplate.opsForValue().set(key, String.valueOf(dbUsed), AI_USAGE_TTL);
        return dbUsed;
    }
}
