package com.launchly.bot.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

@Schema(description = "Request payload to update team member role and permissions on a bot")
public record UpdateMemberRequest(
    @Schema(description = "Updated role: ADMIN, EDITOR, VIEWER", example = "ADMIN", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Role is required")
    @Pattern(regexp = "^(?i)(ADMIN|EDITOR|VIEWER)$", message = "Invalid role. Allowed values: ADMIN, EDITOR, VIEWER")
    String role,

    @Schema(description = "Grant Live Chat / Inbox management access", example = "true")
    boolean inboxSeat,

    @Schema(description = "Grant billing management permissions", example = "false")
    boolean billingPermission
) {}
