package com.launchly.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;
import java.time.LocalDateTime;

@Schema(description = "Detailed administrative overview of a broadcast campaign")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminBroadcastDetailDto {
    @Schema(description = "Broadcast ID", example = "5")
    private Long id;

    @Schema(description = "Campaign title", example = "Spring Sale")
    private String title;

    @Schema(description = "First message preview content", example = "Special discounts for loyal users!")
    private String content;

    @Schema(description = "Target audience filter summary", example = "ALL (340 contacts)")
    private String targetAudience;

    @Schema(description = "Connected Bot name", example = "Sales Bot")
    private String botName;

    @Schema(description = "Total delivered messages count", example = "335")
    private int sentCount;

    @Schema(description = "Total failed message deliveries", example = "5")
    private int failedCount;

    @Schema(description = "Total contacts targeted", example = "340")
    private int totalCount;

    @Schema(description = "Campaign status: DRAFT, SCHEDULED, IN_PROGRESS, COMPLETED, FAILED, BLOCKED", example = "COMPLETED")
    private String status;

    @Schema(description = "Whether campaign was blocked by admin", example = "false")
    private boolean blocked;

    @Schema(description = "Block reason if applicable", example = "admin.reason_spam")
    private String blockReason;

    @Schema(description = "Timestamp when blocked")
    private LocalDateTime blockedAt;

    @Schema(description = "Author email", example = "john@example.com")
    private String createdByEmail;

    @Schema(description = "Author display name", example = "John Doe")
    private String authorName;

    @Schema(description = "Author user ID", example = "15")
    private Long authorId;

    @Schema(description = "Creation date")
    private LocalDateTime createdAt;

    @Schema(description = "Scheduled dispatch time if scheduled")
    private LocalDateTime scheduledAt;

    @Schema(description = "Audit logs associated with this broadcast campaign")
    private Page<UserActivityDto> activities;
}

