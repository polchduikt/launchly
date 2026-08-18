package com.launchly.admin.dto;

import com.launchly.auth.entity.Provider;
import com.launchly.auth.entity.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;
import java.time.LocalDateTime;
import java.util.List;

@Schema(description = "Detailed profile and activity statistics of a user for administrators")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDetailDto {
    @Schema(description = "User ID", example = "15")
    private Long id;

    @Schema(description = "Email address", example = "alex@example.com")
    private String email;

    @Schema(description = "Display name", example = "Alex Smith")
    private String name;

    @Schema(description = "Avatar URL")
    private String avatar;

    @Schema(description = "Role", example = "ROLE_USER")
    private Role role;

    @Schema(description = "Account active state", example = "true")
    private boolean active;

    @Schema(description = "Reason for block if inactive")
    private String blockReason;

    @Schema(description = "Timestamp when blocked")
    private LocalDateTime blockedAt;

    @Schema(description = "Auth provider: LOCAL, GOOGLE, TELEGRAM")
    private Provider provider;

    @Schema(description = "Registration date")
    private LocalDateTime createdAt;

    @Schema(description = "Linked Telegram username", example = "alex_tg")
    private String telegramUsername;

    @Schema(description = "Bots owned count", example = "3")
    private long botsCount;

    @Schema(description = "Automations count", example = "8")
    private long automationsCount;

    @Schema(description = "Broadcasts count", example = "4")
    private long broadcastsCount;

    @Schema(description = "Total audience contacts", example = "1200")
    private long contactsCount;

    @Schema(description = "Messages processed", example = "34000")
    private long messagesCount;

    @Schema(description = "Active plan name", example = "PRO")
    private String planName;

    @Schema(description = "Subscription status: ACTIVE, PAST_DUE, CANCELED", example = "ACTIVE")
    private String planStatus;

    @Schema(description = "Last platform activity timestamp")
    private LocalDateTime lastActivity;

    @Schema(description = "Paginated audit logs of user actions")
    private Page<UserActivityDto> activities;

    @Schema(description = "List of user automations")
    private List<UserAutomationSummaryDto> automations;

    @Schema(description = "List of user broadcasts")
    private List<UserBroadcastSummaryDto> broadcasts;
}

