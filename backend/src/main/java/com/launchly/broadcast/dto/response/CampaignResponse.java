package com.launchly.broadcast.dto.response;

import com.launchly.broadcast.entity.CampaignStatus;
import com.launchly.broadcast.entity.FilterType;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "Broadcast campaign details and dispatch progress metrics")
public record CampaignResponse(
        @Schema(description = "Campaign ID", example = "4")
        Long id,

        @Schema(description = "Campaign name", example = "Summer Sale Announcement")
        String name,

        @Schema(description = "Direct message text")
        String message,

        @Schema(description = "Campaign state: DRAFT, SCHEDULED, SENDING, SENT, FAILED, CANCELLED", example = "SENT")
        CampaignStatus status,

        @Schema(description = "Whether campaign is administratively blocked", example = "false")
        Boolean blocked,

        @Schema(description = "Administrative block reason")
        String blockReason,

        @Schema(description = "Timestamp when blocked")
        LocalDateTime blockedAt,

        @Schema(description = "Filter type: ALL, BY_TAG, BY_CUSTOM_FIELD", example = "BY_TAG")
        FilterType filterType,

        @Schema(description = "Filter parameter", example = "VIP")
        String filterValue,

        @Schema(description = "Scheduled dispatch time")
        LocalDateTime scheduledAt,

        @Schema(description = "Successfully sent messages count", example = "840")
        Integer sentCount,

        @Schema(description = "Failed deliveries count", example = "5")
        Integer failedCount,

        @Schema(description = "Target audience recipients count", example = "845")
        Integer totalCount,

        @Schema(description = "Target Bot ID", example = "5")
        Long botId,

        @Schema(description = "Flow nodes JSON")
        String nodes,

        @Schema(description = "Flow edges JSON")
        String edges,

        @Schema(description = "Whether targeted all user bots", example = "false")
        Boolean targetAllBots,

        @Schema(description = "Template name if bundled in template")
        String templateName,

        @Schema(description = "Creation date")
        LocalDateTime createdAt,

        @Schema(description = "Last update timestamp")
        LocalDateTime updatedAt
) {}

