package com.launchly.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;

@Schema(description = "Notification preferences update payload")
public record UpdateNotificationsRequest(
        @Schema(description = "Enable email delivery notifications", example = "true")
        boolean notifyEmail,

        @Schema(description = "Enable Telegram alert notifications", example = "true")
        boolean notifyTelegram,

        @Schema(description = "Custom recipient email for system notifications", example = "alerts@example.com")
        @Email(message = "Invalid email format")
        String notificationEmail
) {}

