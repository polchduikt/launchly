package com.launchly.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;
import java.time.LocalDateTime;

@Schema(description = "Detailed administrative view of an automation flow schema")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAutomationDetailDto {
    @Schema(description = "Automation ID", example = "10")
    private Long id;

    @Schema(description = "Flow name", example = "Onboarding Flow")
    private String name;

    @Schema(description = "Trigger type", example = "COMMAND_START")
    private String triggerType;

    @Schema(description = "Connected Bot ID", example = "2")
    private Long botId;

    @Schema(description = "Connected Bot name", example = "Support Bot")
    private String botName;

    @Schema(description = "Whether the bot is currently running", example = "true")
    private boolean botActive;

    @Schema(description = "Whether the flow is blocked by administrator", example = "false")
    private boolean blocked;

    @Schema(description = "Block reason if applicable", example = "admin.reason_spam")
    private String blockReason;

    @Schema(description = "Timestamp when blocked")
    private LocalDateTime blockedAt;

    @Schema(description = "Owner user ID", example = "15")
    private Long ownerId;

    @Schema(description = "Owner display name", example = "John Doe")
    private String ownerName;

    @Schema(description = "Owner email address", example = "john@example.com")
    private String ownerEmail;

    @Schema(description = "Owner avatar URL")
    private String ownerAvatar;

    @Schema(description = "Number of nodes in the flow schema", example = "14")
    private int nodesCount;

    @Schema(description = "Number of edges/connections in schema", example = "18")
    private int edgesCount;

    @Schema(description = "Number of external integrations configured in flow", example = "2")
    private int integrationsCount;

    @Schema(description = "Schema version number", example = "3")
    private int version;

    @Schema(description = "Total trigger count", example = "1540")
    private int triggerCount;

    @Schema(description = "Total error count", example = "1")
    private int errorCount;

    @Schema(description = "Creation date")
    private LocalDateTime createdAt;

    @Schema(description = "Last update date")
    private LocalDateTime updatedAt;

    @Schema(description = "Paginated audit logs related to this automation")
    private Page<UserActivityDto> activities;
}

