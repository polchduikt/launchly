package com.launchly.broadcast.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.launchly.broadcast.entity.FilterType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Schema(description = "Request payload to create a mass broadcast message campaign")
public record CreateCampaignRequest(
        @Schema(description = "Campaign name", example = "Summer Sale Announcement", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "Campaign name is required")
        String name,

        @Schema(description = "Direct text message body (if not using visual flow schema)", example = "🔥 Special 50% discount this weekend only!")
        String message,

        @Schema(description = "Recipient filtering mode: ALL, BY_TAG, BY_CUSTOM_FIELD", example = "ALL", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull(message = "Filter type is required")
        FilterType filterType,

        @Schema(description = "Filter criterion parameter (e.g. tag name or field query value)", example = "VIP")
        String filterValue,

        @Schema(description = "Optional future dispatch timestamp (ISO-8601)", example = "2026-09-01T10:00:00")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm[:ss][.SSS]")
        LocalDateTime scheduledAt,

        @Schema(description = "JSON visual graph nodes for interactive broadcast flow")
        String nodes,

        @Schema(description = "JSON visual graph edges for interactive broadcast flow")
        String edges,

        @Schema(description = "Target bot ID (required if targetAllBots is false)", example = "5")
        Long botId,

        @Schema(description = "Whether to broadcast across all user bots simultaneously", example = "false")
        Boolean targetAllBots
) {}

