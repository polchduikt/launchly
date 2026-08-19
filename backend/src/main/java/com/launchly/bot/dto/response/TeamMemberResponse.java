package com.launchly.bot.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "Team member or pending invitation for bot collaboration")
public record TeamMemberResponse(
    @Schema(description = "Membership / invitation ID", example = "1")
    Long id,

    @Schema(description = "User ID", example = "12")
    Long userId,

    @Schema(description = "Email address", example = "colleague@example.com")
    String email,

    @Schema(description = "Display name", example = "Jane Doe")
    String name,

    @Schema(description = "Avatar URL")
    String avatar,

    @Schema(description = "Role: OWNER, ADMIN, EDITOR, VIEWER, SUPPORT", example = "EDITOR")
    String role,

    @Schema(description = "Has Live Chat seat access", example = "true")
    boolean inboxSeat,

    @Schema(description = "Has billing permissions", example = "false")
    boolean billingPermission,

    @Schema(description = "Whether invitation is pending user acceptance", example = "false")
    boolean isPending,

    @Schema(description = "Invited / added timestamp")
    LocalDateTime createdAt,

    @Schema(description = "Bot ID", example = "5")
    Long botId
) {
    public TeamMemberResponse(
        Long id, Long userId, String email, String name, String avatar,
        String role, boolean inboxSeat, boolean billingPermission,
        boolean isPending, LocalDateTime createdAt
    ) {
        this(id, userId, email, name, avatar, role, inboxSeat, billingPermission, isPending, createdAt, null);
    }
}

