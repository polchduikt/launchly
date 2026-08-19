package com.launchly.auth.dto.response;

import com.launchly.auth.entity.AuthSessionStatus;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Status polling result for Telegram QR/link authentication")
public record TelegramStatusResponse(
        @Schema(description = "Session status: PENDING, SUCCESS, EXPIRED", example = "SUCCESS")
        AuthSessionStatus status,

        @Schema(description = "JWT Access Token (populated when status is SUCCESS)", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
        String accessToken,

        @Schema(description = "JWT Refresh Token (populated when status is SUCCESS)", example = "4c3d82a1-0e12-45e3-9876-abcdef123456")
        String refreshToken,

        @Schema(description = "Authenticated user profile (populated when status is SUCCESS)")
        UserResponse user
) {
    public static TelegramStatusResponse pending() {
        return new TelegramStatusResponse(AuthSessionStatus.PENDING, null, null, null);
    }

    public static TelegramStatusResponse expired() {
        return new TelegramStatusResponse(AuthSessionStatus.EXPIRED, null, null, null);
    }

    public static TelegramStatusResponse success(String accessToken, String refreshToken, UserResponse user) {
        return new TelegramStatusResponse(AuthSessionStatus.SUCCESS, accessToken, refreshToken, user);
    }
}

