package com.launchly.auth.service;

import com.launchly.auth.dto.request.LoginRequest;
import com.launchly.auth.dto.request.RegisterRequest;
import com.launchly.auth.dto.response.AuthResponse;
import com.launchly.auth.dto.response.TelegramSessionResponse;
import com.launchly.auth.dto.response.TelegramStatusResponse;
import com.launchly.auth.dto.response.UserResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refreshToken(String refreshToken);

    void logout(String refreshToken);

    UserResponse getCurrentUser(String email);

    TelegramSessionResponse createTelegramSession(String currentEmail);

    TelegramStatusResponse checkTelegramSessionStatus(String token);

    void unlinkTelegram(String currentEmail);

    void handleTelegramAuth(String token, Long telegramUserId, String telegramUsername);
}
