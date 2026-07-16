package com.launchly.auth.dto.response;

public record UserResponse(
        Long id,
        String email,
        String name,
        String avatar,
        String role,
        Long telegramUserId,
        String telegramUsername
) {}
