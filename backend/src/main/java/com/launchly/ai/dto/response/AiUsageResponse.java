package com.launchly.ai.dto.response;

public record AiUsageResponse(
    int requestsUsed,
    int requestsLimit,
    String resetsAt
) {}
