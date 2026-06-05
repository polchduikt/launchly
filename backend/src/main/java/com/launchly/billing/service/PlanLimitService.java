package com.launchly.billing.service;

public interface PlanLimitService {
    void checkBotLimit(Long userId);
    void checkBotUserLimit(Long botId);
    void checkBroadcastAccess(Long userId);
    void checkIntegrationAccess(Long userId);
    void checkAiAccess(Long userId);
}
