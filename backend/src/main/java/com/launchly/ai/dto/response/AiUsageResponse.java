package com.launchly.ai.dto.response;

public record AiUsageResponse(
    long tokensUsed,
    long tokenLimit,
    long tokensRemaining,
    int remainingPercentage,
    String resetsAt
) {}
