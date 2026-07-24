package com.launchly.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAutomationSummaryDto {
    private Long id;
    private String name;
    private String botName;
    private boolean active;
    private int triggerCount;
    private String triggerType;
}
