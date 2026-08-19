package com.launchly.crm.dto.response;

import com.launchly.crm.entity.LeadStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "Captured lead details in CRM pipeline")
public record LeadResponse(
        @Schema(description = "Lead ID", example = "3")
        Long id,

        @Schema(description = "Lead person name", example = "Іван Петренко")
        String name,

        @Schema(description = "Contact email", example = "ivan@example.com")
        String email,

        @Schema(description = "Phone number", example = "+380671234567")
        String phone,

        @Schema(description = "Lead acquisition source / flow node", example = "Telegram bot onboarding")
        String source,

        @Schema(description = "Pipeline status: NEW, CONTACTED, QUALIFIED, WON, LOST", example = "NEW")
        LeadStatus status,

        @Schema(description = "Agent notes")
        String notes,

        @Schema(description = "Custom captured form field data JSON")
        String data,

        @Schema(description = "Telegram subscriber name")
        String botUserName,

        @Schema(description = "Telegram username")
        String botUserUsername,

        @Schema(description = "Captured timestamp")
        LocalDateTime createdAt,

        @Schema(description = "Last update timestamp")
        LocalDateTime updatedAt
) {}

