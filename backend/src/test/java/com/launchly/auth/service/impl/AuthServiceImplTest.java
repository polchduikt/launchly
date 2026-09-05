package com.launchly.auth.service.impl;

import com.launchly.admin.service.UserAuditService;
import com.launchly.auth.dto.request.LoginRequest;
import com.launchly.auth.dto.request.RegisterRequest;
import com.launchly.auth.dto.request.UpdateProfileRequest;
import com.launchly.auth.dto.response.AuthResponse;
import com.launchly.auth.dto.response.TelegramSessionResponse;
import com.launchly.auth.dto.response.TelegramStatusResponse;
import com.launchly.auth.dto.response.UserResponse;
import com.launchly.auth.entity.*;
import com.launchly.auth.mapper.AuthMapper;
import com.launchly.auth.repository.TelegramAuthSessionRepository;
import com.launchly.auth.repository.UserRepository;
import com.launchly.auth.service.TokenService;
import com.launchly.billing.repository.SubscriptionRepository;
import com.launchly.billing.service.BillingService;
import com.launchly.bot.repository.BotMemberRepository;
import com.launchly.bot.repository.BotRepository;
import com.launchly.common.exception.AppException;
import com.launchly.common.utils.MessageUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TokenService tokenService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthMapper authMapper;

    @Mock
    private BillingService billingService;

    @Mock
    private TelegramAuthSessionRepository telegramAuthSessionRepository;

    @Mock
    private BotRepository botRepository;

    @Mock
    private BotMemberRepository botMemberRepository;

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private UserAuditService userAuditService;

    @Mock
    private MessageUtils messageUtils;

    @Mock
    private com.launchly.common.security.turnstile.TurnstileService turnstileService;

    @InjectMocks
    private AuthServiceImpl authService;

    private User testUser;
    private UserResponse mockUserResponse;

    @BeforeEach
    void setUp() {
        lenient().when(turnstileService.verifyToken(any())).thenReturn(true);
        testUser = User.builder()
                .email("test@launchly.pro")
                .password("encoded_pass")
                .name("Test User")
                .role(Role.ROLE_OWNER)
                .provider(Provider.LOCAL)
                .active(true)
                .build();
        ReflectionTestUtils.setField(testUser, "id", 1L);

        mockUserResponse = mock(UserResponse.class);
    }

    @Test
    @DisplayName("Should successfully register a new user and assign free tier")
    void register_Success() {
        RegisterRequest request = new RegisterRequest("new@launchly.pro", "secret123", "New User");
        when(userRepository.existsByEmail("new@launchly.pro")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("encoded_secret");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(tokenService.generateAccessToken(any(User.class))).thenReturn("access_token");
        when(tokenService.generateRefreshToken(any(User.class))).thenReturn("refresh_token");
        when(authMapper.toUserResponse(any(User.class))).thenReturn(mockUserResponse);

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("access_token");
        verify(billingService, times(1)).createFreeSubscription(eq(1L));
        verify(userAuditService, times(1)).logRegistration(any(User.class), any(), any());
    }

    @Test
    @DisplayName("Should throw Conflict when registering duplicate email")
    void register_WhenEmailExists_ThrowsConflict() {
        RegisterRequest request = new RegisterRequest("test@launchly.pro", "secret123", "User");
        when(userRepository.existsByEmail("test@launchly.pro")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("Should successfully login with valid credentials")
    void login_Success() {
        LoginRequest request = new LoginRequest("test@launchly.pro", "password123");
        when(userRepository.findByEmail("test@launchly.pro")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password123", "encoded_pass")).thenReturn(true);
        when(tokenService.generateAccessToken(testUser)).thenReturn("access_token");
        when(tokenService.generateRefreshToken(testUser)).thenReturn("refresh_token");
        when(authMapper.toUserResponse(testUser)).thenReturn(mockUserResponse);

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("access_token");
        verify(userAuditService, times(1)).logLogin(eq(testUser), any());
    }

    @Test
    @DisplayName("Should throw Unauthorized when login password is wrong")
    void login_WhenPasswordInvalid_ThrowsUnauthorized() {
        LoginRequest request = new LoginRequest("test@launchly.pro", "wrongpass");
        when(userRepository.findByEmail("test@launchly.pro")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongpass", "encoded_pass")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("Should throw Forbidden when login account is blocked")
    void login_WhenUserBlocked_ThrowsForbidden() {
        testUser.setActive(false);
        LoginRequest request = new LoginRequest("test@launchly.pro", "password123");
        when(userRepository.findByEmail("test@launchly.pro")).thenReturn(Optional.of(testUser));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Should successfully refresh access token with valid refresh token")
    void refreshToken_Success() {
        RefreshToken refreshToken = RefreshToken.builder().token("valid_refresh").user(testUser).build();
        when(tokenService.verifyRefreshToken("valid_refresh")).thenReturn(refreshToken);
        when(tokenService.generateAccessToken(testUser)).thenReturn("new_access_token");
        when(tokenService.generateRefreshToken(testUser)).thenReturn("new_refresh_token");
        when(authMapper.toUserResponse(testUser)).thenReturn(mockUserResponse);

        AuthResponse response = authService.refreshToken("valid_refresh");

        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("new_access_token");
        verify(tokenService, times(1)).deleteRefreshToken("valid_refresh");
    }

    @Test
    @DisplayName("Should throw Forbidden when refreshing token for blocked user")
    void refreshToken_WhenUserBlocked_ThrowsForbidden() {
        testUser.setActive(false);
        RefreshToken refreshToken = RefreshToken.builder().token("valid_refresh").user(testUser).build();
        when(tokenService.verifyRefreshToken("valid_refresh")).thenReturn(refreshToken);

        assertThatThrownBy(() -> authService.refreshToken("valid_refresh"))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Should delete refresh token upon logout")
    void logout_Success() {
        authService.logout("test_refresh_token");
        verify(tokenService, times(1)).deleteRefreshToken("test_refresh_token");
    }

    @Test
    @DisplayName("Should get current user profile")
    void getCurrentUser_Success() {
        when(userRepository.findByEmail("test@launchly.pro")).thenReturn(Optional.of(testUser));
        when(authMapper.toUserResponse(testUser)).thenReturn(mockUserResponse);

        UserResponse response = authService.getCurrentUser("test@launchly.pro");

        assertThat(response).isNotNull();
    }

    @Test
    @DisplayName("Should throw NotFound when getting profile for non-existent user")
    void getCurrentUser_WhenNotFound_ThrowsNotFound() {
        when(userRepository.findByEmail("unknown@launchly.pro")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.getCurrentUser("unknown@launchly.pro"))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("Should successfully update profile name and password")
    void updateProfile_Success() {
        UpdateProfileRequest request = new UpdateProfileRequest("new_name", "test@launchly.pro", null, "old_pass", "new_secret_pass");
        when(userRepository.findByEmail("test@launchly.pro")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("old_pass", "encoded_pass")).thenReturn(true);
        when(passwordEncoder.encode("new_secret_pass")).thenReturn("new_encoded_pass");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(authMapper.toUserResponse(any(User.class))).thenReturn(mockUserResponse);

        UserResponse response = authService.updateProfile("test@launchly.pro", request);

        assertThat(response).isNotNull();
        assertThat(testUser.getName()).isEqualTo("new_name");
    }

    @Test
    @DisplayName("Should throw BadRequest when updating password with invalid current password")
    void updateProfile_WrongCurrentPassword_ThrowsBadRequest() {
        UpdateProfileRequest request = new UpdateProfileRequest("new_name", "test@launchly.pro", null, "wrong_pass", "new_secret_pass");
        when(userRepository.findByEmail("test@launchly.pro")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrong_pass", "encoded_pass")).thenReturn(false);

        assertThatThrownBy(() -> authService.updateProfile("test@launchly.pro", request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Should create telegram auth session")
    void createTelegramSession_Success() {
        when(telegramAuthSessionRepository.save(any(TelegramAuthSession.class)))
                .thenAnswer(i -> i.getArgument(0));

        TelegramSessionResponse response = authService.createTelegramSession(null, false);

        assertThat(response).isNotNull();
        assertThat(response.token()).isNotBlank();
        verify(telegramAuthSessionRepository, times(1)).save(any(TelegramAuthSession.class));
    }

    @Test
    @DisplayName("Should return pending status for active telegram auth session")
    void checkTelegramSessionStatus_WhenPending_ReturnsPending() {
        TelegramAuthSession session = TelegramAuthSession.builder()
                .token("tok123")
                .status(AuthSessionStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();
        when(telegramAuthSessionRepository.findByToken("tok123")).thenReturn(Optional.of(session));

        TelegramStatusResponse response = authService.checkTelegramSessionStatus("tok123");

        assertThat(response.status()).isEqualTo(AuthSessionStatus.PENDING);
    }

    @Test
    @DisplayName("Should throw NotFound when checking non-existent telegram session")
    void checkTelegramSessionStatus_WhenNotFound_ThrowsNotFound() {
        when(telegramAuthSessionRepository.findByToken("invalid_tok")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.checkTelegramSessionStatus("invalid_tok"))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("Should unlink telegram from user profile")
    void unlinkTelegram_Success() {
        testUser.setTelegramUserId(12345L);
        when(userRepository.findByEmail("test@launchly.pro")).thenReturn(Optional.of(testUser));

        authService.unlinkTelegram("test@launchly.pro");

        assertThat(testUser.getTelegramUserId()).isNull();
        verify(userRepository, times(1)).save(testUser);
    }

    @Test
    @DisplayName("Should cascade delete user and associated entities")
    void deleteUserAccount_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(botRepository.findAllByUserId(1L)).thenReturn(Collections.emptyList());
        when(botMemberRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(subscriptionRepository.findByUserId(1L)).thenReturn(Optional.empty());

        authService.deleteUserAccount(1L);

        verify(userRepository, times(1)).delete(testUser);
    }

    @Test
    @DisplayName("Should throw NotFound when deleting non-existent account")
    void deleteUserAccount_WhenNotFound_ThrowsNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.deleteUserAccount(99L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("Should throw BadRequest when Turnstile captcha fails on registration")
    void register_WhenTurnstileFails_ThrowsBadRequest() {
        RegisterRequest request = new RegisterRequest("new@launchly.pro", "secret123", "New User", "invalid_token");
        when(turnstileService.verifyToken("invalid_token")).thenReturn(false);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Should throw BadRequest when Turnstile captcha fails on login")
    void login_WhenTurnstileFails_ThrowsBadRequest() {
        LoginRequest request = new LoginRequest("test@launchly.pro", "secret123", "invalid_token");
        when(turnstileService.verifyToken("invalid_token")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }
}
