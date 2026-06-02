package com.launchly.auth.service;

import com.launchly.auth.entity.RefreshToken;
import com.launchly.auth.entity.User;

public interface TokenService {

    String generateAccessToken(User user);

    String generateRefreshToken(User user);

    RefreshToken verifyRefreshToken(String token);

    boolean validateAccessToken(String token);

    String getEmailFromToken(String token);

    void deleteRefreshToken(String token);

    void deleteAllRefreshTokensByUser(User user);
}
