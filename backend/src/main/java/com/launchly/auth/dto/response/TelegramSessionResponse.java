package com.launchly.auth.dto.response;

public record TelegramSessionResponse(
        String token,
        String botUsername
) {}
