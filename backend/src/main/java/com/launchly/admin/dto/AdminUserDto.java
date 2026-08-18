package com.launchly.admin.dto;

import com.launchly.auth.entity.Provider;
import com.launchly.auth.entity.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Schema(description = "Admin overview of a registered user")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDto {
    @Schema(description = "User unique ID", example = "1")
    private Long id;

    @Schema(description = "User email address", example = "john.doe@example.com")
    private String email;

    @Schema(description = "User display name", example = "John Doe")
    private String name;

    @Schema(description = "Avatar URL", example = "https://res.cloudinary.com/demo/image/upload/avatar.jpg")
    private String avatar;

    @Schema(description = "Security role", example = "ROLE_USER")
    private Role role;

    @Schema(description = "Account active state", example = "true")
    private boolean active;

    @Schema(description = "Reason for block if account is inactive", example = "admin.reason_rules")
    private String blockReason;

    @Schema(description = "Timestamp when account was blocked")
    private LocalDateTime blockedAt;

    @Schema(description = "Registration provider: LOCAL, GOOGLE, TELEGRAM")
    private Provider provider;

    @Schema(description = "Account creation timestamp")
    private LocalDateTime createdAt;

    @Schema(description = "Total number of bots owned", example = "3")
    private int botsCount;

    @Schema(description = "Total number of automations", example = "12")
    private long automationsCount;

    @Schema(description = "Total number of broadcasts", example = "5")
    private long broadcastsCount;

    @Schema(description = "Total number of contacts across all bots", example = "1420")
    private long contactsCount;

    @Schema(description = "Total messages processed", example = "58000")
    private long messagesCount;

    @Schema(description = "Current active subscription plan name", example = "PRO")
    private String planName;

    @Schema(description = "Connected Telegram username", example = "johndoe_tg")
    private String telegramUsername;
}

