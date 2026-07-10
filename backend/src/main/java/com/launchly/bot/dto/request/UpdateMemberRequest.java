package com.launchly.bot.dto.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateMemberRequest(
    @NotBlank(message = "Role is required")
    String role,

    boolean inboxSeat,
    boolean billingPermission
) {}
