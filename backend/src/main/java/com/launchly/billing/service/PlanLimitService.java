package com.launchly.billing.service;

import com.launchly.billing.entity.Plan;

public interface PlanLimitService {
    void checkBotLimit(Long userId);
    void checkBotUserLimit(Long botId);
    void checkBroadcastAccess(Long userId);
    void checkIntegrationAccess(Long userId);
    void checkAiAccess(Long userId);
    Plan getActivePlan(Long userId);
    Plan getPlan(Long planId);
}
