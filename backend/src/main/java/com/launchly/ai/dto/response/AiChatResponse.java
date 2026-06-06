package com.launchly.ai.dto.response;

public record AiChatResponse(
    String reply,
    int requestsUsed,
    int requestsLimit
) {}
