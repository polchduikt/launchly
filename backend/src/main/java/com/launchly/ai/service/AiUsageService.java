package com.launchly.ai.service;

import com.launchly.billing.entity.Plan;
import com.launchly.ai.dto.response.AiUsageResponse;

public interface AiUsageService {

    void checkAndIncrement(Long userId, Plan plan);

    AiUsageResponse getUsage(Long userId, Plan plan);
}
