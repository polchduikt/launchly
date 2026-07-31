package com.launchly.ai.dto.response;

public record AiChatResponse(
    String reply,
    AiUsageResponse usage
) {}
