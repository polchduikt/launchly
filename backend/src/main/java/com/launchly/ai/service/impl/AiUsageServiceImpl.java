package com.launchly.ai.service.impl;

import com.launchly.ai.dto.response.AiUsageResponse;
import com.launchly.ai.entity.AiUsage;
import com.launchly.ai.repository.AiUsageRepository;
import com.launchly.ai.service.AiUsageService;
import com.launchly.auth.entity.User;
import com.launchly.auth.repository.UserRepository;
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
    private final UserRepository userRepository;
    private final StringRedisTemplate redisTemplate;

    private static final String AI_USAGE_KEY = "launchly:ai:usage:%d:%s";
    private static final Duration AI_USAGE_TTL = Duration.ofHours(25);
    private static final int FREE_PLAN_LIMIT = 20;

    @Override
    @Transactional
    public void checkAndIncrement(Long userId, Plan plan) {
        String key = String.format(AI_USAGE_KEY, userId, LocalDate.now());
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1) {
            redisTemplate.expire(key, AI_USAGE_TTL);
        }
        if ("FREE".equalsIgnoreCase(plan.getName()) && count != null && count > FREE_PLAN_LIMIT) {
            throw new AppException(HttpStatus.PAYMENT_REQUIRED,
                "Daily AI limit reached. Upgrade your plan for unlimited access.");
        }
        LocalDate today = LocalDate.now();
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
        aiUsage.setRequestCount(count != null ? count.intValue() : aiUsage.getRequestCount() + 1);
        aiUsageRepository.save(aiUsage);
    }

    @Override
    @Transactional(readOnly = true)
    public AiUsageResponse getUsage(Long userId, Plan plan) {
        String key = String.format(AI_USAGE_KEY, userId, LocalDate.now());
        String value = redisTemplate.opsForValue().get(key);
        int used;
        if (value != null) {
            used = Integer.parseInt(value);
        } else {
            used = aiUsageRepository.findByUserIdAndDate(userId, LocalDate.now())
                    .map(AiUsage::getRequestCount)
                    .orElse(0);
            redisTemplate.opsForValue().set(key, String.valueOf(used), AI_USAGE_TTL);
        }
        int limit = "FREE".equalsIgnoreCase(plan.getName()) ? FREE_PLAN_LIMIT : -1; // -1 = безліміт
        return new AiUsageResponse(used, limit, LocalDate.now().plusDays(1).atStartOfDay().toString());
    }
}
