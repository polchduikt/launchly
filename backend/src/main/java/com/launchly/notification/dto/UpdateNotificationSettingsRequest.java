package com.launchly.notification.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@Schema(description = "Request payload to update user notification preferences and automated stats digest schedules")
public record UpdateNotificationSettingsRequest(
        @Schema(description = "Enable general alerts via email", example = "true")
        boolean notifyEmail,

        @Schema(description = "Enable general alerts via linked Telegram account", example = "true")
        boolean notifyTelegram,

        @Schema(description = "Dedicated email address for notifications", example = "alerts@example.com")
        @Email String notificationEmail,

        @Schema(description = "Enable scheduled automated bot statistics digest delivery", example = "true")
        boolean statsNotificationsEnabled,

        @Schema(description = "Day of week for weekly digest (MONDAY, FRIDAY, etc.)", example = "MONDAY")
        String statsDayOfWeek,

        @Schema(description = "Hour of the day to deliver digest (0-23 UTC)", example = "9")
        @Min(0) @Max(23) int statsHour,

        @Schema(description = "Time period range for digest in days (1-30)", example = "7")
        @Min(1) @Max(30) int statsDaysRange,

        @Schema(description = "Send stats digest via email", example = "true")
        boolean statsNotifyEmail,

        @Schema(description = "Send stats digest via Telegram", example = "true")
        boolean statsNotifyTelegram
) {}

