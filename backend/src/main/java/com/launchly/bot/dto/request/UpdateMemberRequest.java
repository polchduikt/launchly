package com.launchly.bot.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request payload to update team member role and permissions on a bot")
public record UpdateMemberRequest(
    @Schema(description = "Updated role: ADMIN, EDITOR, VIEWER, SUPPORT", example = "ADMIN", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Role is required")
    String role,

    @Schema(description = "Grant Live Chat / Inbox management access", example = "true")
    boolean inboxSeat,

    @Schema(description = "Grant billing management permissions", example = "false")
    boolean billingPermission
) {}

