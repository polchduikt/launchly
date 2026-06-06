package com.launchly.ai.service;

public interface AiUsageService {

    int checkUsageLimit(Long userId);

    void incrementUsage(Long userId);

    int getCurrentUsage(Long userId);
}
