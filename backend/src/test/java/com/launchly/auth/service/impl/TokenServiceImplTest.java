package com.launchly.auth.service.impl;

import com.launchly.auth.entity.RefreshToken;
import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import com.launchly.auth.repository.RefreshTokenRepository;
import com.launchly.common.exception.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TokenServiceImplTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private TokenServiceImpl tokenService;

    private User testUser;
    private final String secretKey = "c2VjdXJlLWtleS1mb3ItdGVzdGluZy1wdXJwb3Nlcy1vbmx5LWxhdW5jaGx5";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(tokenService, "jwtSecret", secretKey);
        ReflectionTestUtils.setField(tokenService, "accessTokenExpiration", 900000L); // 15 min
        ReflectionTestUtils.setField(tokenService, "refreshTokenExpiration", 604800000L); // 7 days

        testUser = User.builder()
                .email("test@example.com")
                .role(Role.ROLE_OWNER)
                .active(true)
                .build();
        ReflectionTestUtils.setField(testUser, "id", 1L);
    }

    @Test
    @DisplayName("Should successfully generate and validate access token")
    void generateAndValidateAccessToken_Success() {
        String token = tokenService.generateAccessToken(testUser);

        assertThat(token).isNotBlank();
        assertThat(tokenService.validateAccessToken(token)).isTrue();
        assertThat(tokenService.getEmailFromToken(token)).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("Should return false for invalid or malformed token")
    void validateAccessToken_InvalidToken_ReturnsFalse() {
        assertThat(tokenService.validateAccessToken("invalid.jwt.token")).isFalse();
    }

    @Test
    @DisplayName("Should generate and persist refresh token")
    void generateRefreshToken_Success() {
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String token = tokenService.generateRefreshToken(testUser);

        assertThat(token).isNotBlank();
        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Should successfully verify valid refresh token")
    void verifyRefreshToken_ValidToken_ReturnsEntity() {
        RefreshToken refreshToken = RefreshToken.builder()
                .token("valid-uuid-token")
                .user(testUser)
                .expiryDate(Instant.now().plusSeconds(3600))
                .build();

        when(refreshTokenRepository.findByToken("valid-uuid-token")).thenReturn(Optional.of(refreshToken));

        RefreshToken result = tokenService.verifyRefreshToken("valid-uuid-token");

        assertThat(result).isNotNull();
        assertThat(result.getToken()).isEqualTo("valid-uuid-token");
    }

    @Test
    @DisplayName("Should throw exception when refresh token has expired")
    void verifyRefreshToken_ExpiredToken_ThrowsException() {
        RefreshToken expiredToken = RefreshToken.builder()
                .token("expired-token")
                .user(testUser)
                .expiryDate(Instant.now().minusSeconds(3600))
                .build();

        when(refreshTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(expiredToken));

        assertThatThrownBy(() -> tokenService.verifyRefreshToken("expired-token"))
                .isInstanceOf(AppException.class);

        verify(refreshTokenRepository, times(1)).delete(expiredToken);
    }
}
