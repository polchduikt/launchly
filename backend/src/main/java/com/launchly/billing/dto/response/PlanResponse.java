package com.launchly.billing.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Schema(description = "Subscription plan tier details and feature limits")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanResponse {
    @Schema(description = "Plan unique ID", example = "2")
    private Long id;

    @Schema(description = "Plan technical code name", example = "PRO")
    private String name;

    @Schema(description = "Plan human-readable display title", example = "Pro Plan")
    private String displayName;

    @Schema(description = "Monthly recurring price", example = "29.00")
    private BigDecimal price;

    @Schema(description = "Currency code", example = "USD")
    private String currency;

    @Schema(description = "Maximum Telegram bots allowed", example = "5")
    private int maxBots;

    @Schema(description = "Maximum subscriber contacts limit across all bots", example = "10000")
    private int maxBotUsers;

    @Schema(description = "Monthly mass broadcast campaigns limit", example = "20")
    private int maxBroadcastsPerMonth;

    @Schema(description = "Permission to dispatch broadcast campaigns", example = "true")
    private boolean canUseBroadcast;

    @Schema(description = "Permission to integrate external webhooks and apps", example = "true")
    private boolean canUseIntegrations;

    @Schema(description = "Permission to utilize AI agent block in bots", example = "true")
    private boolean canUseAiAgent;

    @Schema(description = "Permission to process customer payments inside bots", example = "true")
    private boolean canUsePayments;
}

