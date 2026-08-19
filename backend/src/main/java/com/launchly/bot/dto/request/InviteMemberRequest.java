package com.launchly.bot.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request payload to invite a team member to collaborate on a bot")
public record InviteMemberRequest(
    @Schema(description = "Invited member email address", example = "colleague@example.com", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email,

    @Schema(description = "Bot member role: ADMIN, EDITOR, VIEWER, SUPPORT", example = "EDITOR", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Role is required")
    String role,

    @Schema(description = "Grant Live Chat / Inbox management access", example = "true")
    boolean inboxSeat,

    @Schema(description = "Grant billing management permissions", example = "false")
    boolean billingPermission
) {}

