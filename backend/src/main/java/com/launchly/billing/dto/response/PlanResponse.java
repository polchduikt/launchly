package com.launchly.billing.dto.response;

import java.math.BigDecimal;

public record PlanResponse(
    Long id,
    String name,
    String displayName,
    BigDecimal price,
    String currency,
    int maxBots,
    int maxBotUsers,
    int maxBroadcastsPerMonth,
    boolean canUseBroadcast,
    boolean canUseIntegrations,
    boolean canUseAiAgent,
    boolean canUsePayments
) {}
