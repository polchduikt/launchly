package com.launchly.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "Brief summary of a broadcast campaign created by a user")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserBroadcastSummaryDto {
    @Schema(description = "Broadcast ID", example = "5")
    private Long id;

    @Schema(description = "Campaign name", example = "Special Offer")
    private String name;

    @Schema(description = "Connected Bot name", example = "Sales Bot")
    private String botName;

    @Schema(description = "Campaign status", example = "COMPLETED")
    private String status;

    @Schema(description = "Successfully sent messages count", example = "335")
    private int sentCount;

    @Schema(description = "Creation date string", example = "2026-08-18")
    private String createdAt;
}

