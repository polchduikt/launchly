package com.launchly.ai.dto.response;

public record AiSchemaResponse(
    Object nodes,
    Object edges,
    int requestsUsed,
    int requestsLimit
) {}
