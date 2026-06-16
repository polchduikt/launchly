package com.launchly.ai.dto.response;

import tools.jackson.databind.JsonNode;

public record AiSchemaResponse(
    JsonNode nodes,
    JsonNode edges,
    int requestsUsed,
    int requestsLimit
) {}
