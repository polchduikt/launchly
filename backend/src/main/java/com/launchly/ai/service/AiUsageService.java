package com.launchly.ai.service;

import com.launchly.billing.entity.Plan;
import com.launchly.ai.dto.response.AiUsageResponse;

public interface AiUsageService {

    void checkTokenLimit(Long userId, Plan plan);

    void recordTokenUsage(Long userId, Plan plan, int tokensConsumed);

    AiUsageResponse getUsage(Long userId, Plan plan);
}
