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

    UserResponse updateProfile(String currentEmail, com.launchly.auth.dto.request.UpdateProfileRequest request);

    TelegramSessionResponse createTelegramSession(String currentEmail, boolean isSubscription);

    TelegramStatusResponse checkTelegramSessionStatus(String token);

    void unlinkTelegram(String currentEmail);

    boolean handleTelegramAuth(String token, Long telegramUserId, String telegramUsername, String telegramName, String telegramPhotoUrl);

    void deleteUserAccount(Long userId);

    void deleteAccountByEmail(String email);
}
