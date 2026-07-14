package com.launchly.notification.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record UpdateNotificationSettingsRequest(
        boolean notifyEmail,
        boolean notifyTelegram,
        @Email String notificationEmail,
        boolean statsNotificationsEnabled,
        String statsDayOfWeek,
        @Min(0) @Max(23) int statsHour,
        @Min(1) @Max(30) int statsDaysRange,
        boolean statsNotifyEmail,
        boolean statsNotifyTelegram
) {}
