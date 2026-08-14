package com.launchly.auth.dto.response;

public record UserResponse(
        Long id,
        String email,
        String name,
        String avatar,
        String role,
        Long telegramUserId,
        String telegramUsername,
        String telegramName,
        String telegramPhotoUrl,
        boolean notifyEmail,
        boolean notifyTelegram,
        String notificationEmail,
        boolean statsNotificationsEnabled,
        String statsDayOfWeek,
        int statsHour,
        int statsDaysRange,
        boolean statsNotifyEmail,
        boolean statsNotifyTelegram,
        String timezone
) {}
