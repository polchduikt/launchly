package com.launchly.auth.dto.response;

import com.launchly.auth.entity.AuthSessionStatus;

public record TelegramStatusResponse(
        AuthSessionStatus status,
        String accessToken,
        String refreshToken,
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
