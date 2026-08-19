package com.launchly.auth.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Detailed user profile and settings response")
public record UserResponse(
        @Schema(description = "User unique ID", example = "1")
        Long id,

        @Schema(description = "User email address", example = "user@example.com")
        String email,

        @Schema(description = "User display name", example = "John Doe")
        String name,

        @Schema(description = "User avatar image URL")
        String avatar,

        @Schema(description = "User role: ROLE_USER, ROLE_ADMIN, ROLE_MANAGER", example = "ROLE_USER")
        String role,

        @Schema(description = "Linked Telegram user ID", example = "123456789")
        Long telegramUserId,

        @Schema(description = "Linked Telegram username", example = "johndoe_tg")
        String telegramUsername,

        @Schema(description = "Linked Telegram display name", example = "John")
        String telegramName,

        @Schema(description = "Telegram profile photo URL")
        String telegramPhotoUrl,

        @Schema(description = "Whether email notifications are enabled", example = "true")
        boolean notifyEmail,

        @Schema(description = "Whether Telegram notifications are enabled", example = "false")
        boolean notifyTelegram,

        @Schema(description = "Alternative notification recipient email", example = "alerts@example.com")
        String notificationEmail,

        @Schema(description = "Whether periodic statistics digests are enabled", example = "true")
        boolean statsNotificationsEnabled,

        @Schema(description = "Day of week for weekly statistics report: MONDAY..SUNDAY", example = "MONDAY")
        String statsDayOfWeek,

        @Schema(description = "Hour of day (0-23) for sending statistics digest", example = "9")
        int statsHour,

        @Schema(description = "Statistics historical days range (e.g. 7 or 30)", example = "7")
        int statsDaysRange,

        @Schema(description = "Deliver stats digest via email", example = "true")
        boolean statsNotifyEmail,

        @Schema(description = "Deliver stats digest via Telegram", example = "false")
        boolean statsNotifyTelegram,

        @Schema(description = "User timezone identifier", example = "Europe/Kyiv")
        String timezone,

        @Schema(description = "Registration auth provider: LOCAL, GOOGLE, TELEGRAM", example = "LOCAL")
        String provider,

        @Schema(description = "Whether account has a password set (false for pure OAuth2 users)", example = "true")
        boolean hasPassword
) {}

