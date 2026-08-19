package com.launchly.integration.dto.request;

import com.launchly.integration.entity.IntegrationType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Request payload to connect an external third-party integration")
public record IntegrationCreateRequest(
    @Schema(description = "Integration instance label", example = "Google Sheets CRM Export", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Name is required")
    String name,

    @Schema(description = "Integration type: GOOGLE_SHEETS, WEBHOOK, MAILCHIMP, HOTMART, EXCEL", example = "GOOGLE_SHEETS", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Type is required")
    IntegrationType type,

    @Schema(description = "Belonging Bot ID", example = "5", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Bot ID is required")
    Long botId,

    @Schema(description = "Provider-specific configuration object (credentials, spreadsheetId, webhookUrl, etc.)")
    Object config
) {}

