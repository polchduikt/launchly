package com.launchly.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Schema(description = "Admin overview of a broadcast campaign")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminBroadcastDto {
    @Schema(description = "Broadcast ID", example = "5")
    private Long id;

    @Schema(description = "Campaign title", example = "Black Friday Special Offer")
    private String title;

    @Schema(description = "First message preview content", example = "Get 50% discount today only!")
    private String content;

    @Schema(description = "Target audience filter summary", example = "ALL (340 contacts)")
    private String targetAudience;

    @Schema(description = "Connected Bot name", example = "Sales Bot")
    private String botName;

    @Schema(description = "Total successfully delivered messages", example = "335")
    private int sentCount;

    @Schema(description = "Total failed message deliveries", example = "5")
    private int failedCount;

    @Schema(description = "Total targeted contacts count", example = "340")
    private int totalCount;

    @Schema(description = "Campaign status: DRAFT, SCHEDULED, IN_PROGRESS, COMPLETED, FAILED, BLOCKED", example = "COMPLETED")
    private String status;

    @Schema(description = "Whether campaign was blocked by administrator", example = "false")
    private boolean blocked;

    @Schema(description = "Reason if blocked", example = "admin.reason_spam")
    private String blockReason;

    @Schema(description = "Timestamp when blocked")
    private LocalDateTime blockedAt;

    @Schema(description = "Creator email", example = "user@example.com")
    private String createdByEmail;

    @Schema(description = "Creator display name", example = "John Doe")
    private String authorName;

    @Schema(description = "Creation timestamp")
    private LocalDateTime createdAt;
}

