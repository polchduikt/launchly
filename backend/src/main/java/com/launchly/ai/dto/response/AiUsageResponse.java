package com.launchly.ai.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "User AI token consumption and remaining quota breakdown")
public record AiUsageResponse(
    @Schema(description = "Total tokens used in current billing cycle", example = "12500")
    long tokensUsed,

    @Schema(description = "Maximum monthly token limit for current plan", example = "50000")
    long tokenLimit,

    @Schema(description = "Tokens remaining until quota is exhausted", example = "37500")
    long tokensRemaining,

    @Schema(description = "Remaining token quota percentage (0-100%)", example = "75")
    int remainingPercentage,

    @Schema(description = "Timestamp when token quota resets (ISO 8601)", example = "2026-09-01T00:00:00Z")
    String resetsAt
) {}

