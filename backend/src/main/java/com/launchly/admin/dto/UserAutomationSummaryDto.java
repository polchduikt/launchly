package com.launchly.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "Brief summary of an automation flow owned by a user")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAutomationSummaryDto {
    @Schema(description = "Automation ID", example = "10")
    private Long id;

    @Schema(description = "Automation flow name", example = "Lead Qualification")
    private String name;

    @Schema(description = "Connected Bot name", example = "Sales Bot")
    private String botName;

    @Schema(description = "Whether the flow is active", example = "true")
    private boolean active;

    @Schema(description = "Trigger executions count", example = "450")
    private int triggerCount;

    @Schema(description = "Trigger event type", example = "COMMAND_START")
    private String triggerType;
}

