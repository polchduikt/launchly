package com.launchly.auth.dto.request;

import jakarta.validation.constraints.Email;

public record UpdateNotificationsRequest(
        boolean notifyEmail,
        boolean notifyTelegram,
        @Email(message = "Invalid email format")
        String notificationEmail
) {}
