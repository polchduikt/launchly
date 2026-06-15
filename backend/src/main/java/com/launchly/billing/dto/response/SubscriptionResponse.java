package com.launchly.billing.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionResponse {
    private Long id;
    private String status;
    private boolean cancelAtPeriodEnd;
    private LocalDateTime currentPeriodStart;
    private LocalDateTime currentPeriodEnd;
    private PlanResponse plan;
}
