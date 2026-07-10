package com.launchly.bot.dto.response;

import java.time.LocalDateTime;

public record TeamMemberResponse(
    Long id,
    Long userId,
    String email,
    String name,
    String avatar,
    String role,
    boolean inboxSeat,
    boolean billingPermission,
    boolean isPending,
    LocalDateTime createdAt
) {}
