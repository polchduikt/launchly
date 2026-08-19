package com.launchly.integration.dto.response;

import com.launchly.integration.entity.IntegrationType;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "External integration instance details")
public record IntegrationResponse(
    @Schema(description = "Integration ID", example = "1")
    Long id,

    @Schema(description = "Integration name", example = "Google Sheets CRM Export")
    String name,

    @Schema(description = "Integration type: GOOGLE_SHEETS, WEBHOOK, MAILCHIMP, HOTMART, EXCEL", example = "GOOGLE_SHEETS")
    IntegrationType type,

    @Schema(description = "Active status flag", example = "true")
    boolean active,

    @Schema(description = "Masked or parsed integration configuration object")
    Object config,

    @Schema(description = "Belonging Bot ID", example = "5")
    Long botId,

    @Schema(description = "Connected timestamp")
    LocalDateTime createdAt
) {}

