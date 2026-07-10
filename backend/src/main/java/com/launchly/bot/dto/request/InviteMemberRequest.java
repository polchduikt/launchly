package com.launchly.bot.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record InviteMemberRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email,

    @NotBlank(message = "Role is required")
    String role,

    boolean inboxSeat,
    boolean billingPermission
) {}
