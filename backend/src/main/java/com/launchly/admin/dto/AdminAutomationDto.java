package com.launchly.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Schema(description = "Admin overview of an automation flow")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAutomationDto {
    @Schema(description = "Automation schema ID", example = "10")
    private Long id;

    @Schema(description = "Flow name", example = "Welcome & Lead Capture")
    private String name;

    @Schema(description = "Trigger type", example = "COMMAND_START")
    private String triggerType;

    @Schema(description = "Owner user email", example = "owner@example.com")
    private String ownerEmail;

    @Schema(description = "Owner display name", example = "Jane Doe")
    private String ownerName;

    @Schema(description = "Connected Bot name", example = "Support Assistant Bot")
    private String botName;

    @Schema(description = "Active status of bot/flow", example = "true")
    private boolean active;

    @Schema(description = "Whether automation is blocked by administrator", example = "false")
    private boolean blocked;

    @Schema(description = "Reason if blocked", example = "admin.reason_spam")
    private String blockReason;

    @Schema(description = "Timestamp when blocked")
    private LocalDateTime blockedAt;

    @Schema(description = "Total times automation triggered", example = "1820")
    private long triggerCount;

    @Schema(description = "Total execution errors encountered", example = "2")
    private long errorCount;

    @Schema(description = "Timestamp of last flow execution")
    private LocalDateTime lastExecutedAt;
}

