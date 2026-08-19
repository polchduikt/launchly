package com.launchly.auth.service.impl;

import com.launchly.auth.dto.request.LoginRequest;
import com.launchly.auth.dto.request.RegisterRequest;
import com.launchly.auth.dto.response.AuthResponse;
import com.launchly.auth.dto.response.UserResponse;
import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import com.launchly.auth.mapper.AuthMapper;
import com.launchly.auth.repository.UserRepository;
import com.launchly.auth.service.TokenService;
import com.launchly.billing.service.BillingService;
import com.launchly.common.exception.AppException;
import com.launchly.common.utils.MessageUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TokenService tokenService;

    @Mock
    private AuthMapper authMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private BillingService billingService;

    @Mock
    private com.launchly.admin.service.UserAuditService userAuditService;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private AuthServiceImpl authService;

    private User testUser;
    private UserResponse testUserResponse;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .email("ivan@example.com")
                .password("encoded_pass")
                .name("Ivan")
                .role(Role.ROLE_OWNER)
                .active(true)
                .build();
        ReflectionTestUtils.setField(testUser, "id", 1L);

        testUserResponse = mock(UserResponse.class);
    }

    @Test
    @DisplayName("Should successfully register a new user and create free subscription")
    void register_WhenValidRequest_Success() {
        RegisterRequest request = new RegisterRequest("ivan@example.com", "Secret123!", "Ivan");

        when(userRepository.existsByEmail("ivan@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Secret123!")).thenReturn("encoded_pass");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(tokenService.generateAccessToken(any(User.class))).thenReturn("access_token_123");
        when(tokenService.generateRefreshToken(any(User.class))).thenReturn("refresh_token_123");
        when(authMapper.toUserResponse(any(User.class))).thenReturn(testUserResponse);

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("access_token_123");
        assertThat(response.refreshToken()).isEqualTo("refresh_token_123");

        verify(billingService, times(1)).createFreeSubscription(1L);
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw conflict exception when email is already registered")
    void register_WhenEmailExists_ThrowsConflict() {
        RegisterRequest request = new RegisterRequest("ivan@example.com", "Secret123!", "Ivan");
        when(userRepository.existsByEmail("ivan@example.com")).thenReturn(true);
        when(messageUtils.getMessage("auth.error.email_already_in_use")).thenReturn("Email already in use");

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(AppException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should successfully authenticate user with valid credentials")
    void login_WhenValidCredentials_Success() {
        LoginRequest request = new LoginRequest("ivan@example.com", "Secret123!");

        when(userRepository.findByEmail("ivan@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("Secret123!", "encoded_pass")).thenReturn(true);
        when(tokenService.generateAccessToken(testUser)).thenReturn("access_token_123");
        when(tokenService.generateRefreshToken(testUser)).thenReturn("refresh_token_123");
        when(authMapper.toUserResponse(testUser)).thenReturn(testUserResponse);

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("access_token_123");
    }

    @Test
    @DisplayName("Should throw unauthorized exception when password does not match")
    void login_WhenWrongPassword_ThrowsUnauthorized() {
        LoginRequest request = new LoginRequest("ivan@example.com", "WrongPass");

        when(userRepository.findByEmail("ivan@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("WrongPass", "encoded_pass")).thenReturn(false);
        when(messageUtils.getMessage("auth.error.invalid_credentials")).thenReturn("Invalid credentials");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("Should throw forbidden exception when account is deactivated or blocked")
    void login_WhenUserBlocked_ThrowsForbidden() {
        testUser.setActive(false);
        testUser.setBlockReason("Terms violation");
        LoginRequest request = new LoginRequest("ivan@example.com", "Secret123!");

        when(userRepository.findByEmail("ivan@example.com")).thenReturn(Optional.of(testUser));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(AppException.class);
    }
}
