package com.launchly.billing.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanResponse {
    private Long id;
    private String name;
    private String displayName;
    private BigDecimal price;
    private String currency;
    private int maxBots;
    private int maxBotUsers;
    private int maxBroadcastsPerMonth;
    private boolean canUseBroadcast;
    private boolean canUseIntegrations;
    private boolean canUseAiAgent;
    private boolean canUsePayments;
}
