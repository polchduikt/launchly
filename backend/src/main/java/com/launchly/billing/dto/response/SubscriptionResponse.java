package com.launchly.billing.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Schema(description = "Active subscription details for current user")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionResponse {
    @Schema(description = "Subscription ID", example = "10")
    private Long id;

    @Schema(description = "Subscription status: ACTIVE, PAST_DUE, CANCELED, INCOMPLETE", example = "ACTIVE")
    private String status;

    @Schema(description = "Whether the subscription is scheduled to cancel at end of current billing cycle", example = "false")
    private boolean cancelAtPeriodEnd;

    @Schema(description = "Start timestamp of current billing cycle")
    private LocalDateTime currentPeriodStart;

    @Schema(description = "End timestamp of current billing cycle")
    private LocalDateTime currentPeriodEnd;

    @Schema(description = "Subscribed plan details")
    private PlanResponse plan;
}

