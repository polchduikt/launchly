package com.launchly.auth.controller;

import com.launchly.auth.dto.request.LoginRequest;
import com.launchly.auth.dto.request.RefreshRequest;
import com.launchly.auth.dto.request.RegisterRequest;
import com.launchly.auth.dto.request.UpdateProfileRequest;
import com.launchly.auth.dto.response.AuthResponse;
import com.launchly.auth.dto.response.UserResponse;
import com.launchly.auth.service.AuthService;
import com.launchly.common.exception.AppException;
import com.launchly.common.exception.GlobalExceptionHandler;
import com.launchly.common.utils.MessageUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import tools.jackson.databind.ObjectMapper;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AuthService authService;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler(messageUtils);
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - Should return 201 Created with tokens for valid request")
    void register_ValidRequest_ReturnsCreated() throws Exception {
        RegisterRequest request = new RegisterRequest("user@launchly.pro", "password123", "User");
        AuthResponse mockResponse = new AuthResponse("access_tok", "refresh_tok", null);

        when(authService.register(any(RegisterRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").value("access_tok"))
                .andExpect(jsonPath("$.refreshToken").value("refresh_tok"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - Should return 400 Bad Request when email format is invalid")
    void register_InvalidEmail_ReturnsBadRequest() throws Exception {
        RegisterRequest request = new RegisterRequest("invalid-email", "password123", "User");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Should return 200 OK for valid login credentials")
    void login_ValidCredentials_ReturnsOk() throws Exception {
        LoginRequest request = new LoginRequest("user@launchly.pro", "password123");
        AuthResponse mockResponse = new AuthResponse("access_tok", "refresh_tok", null);

        when(authService.login(any(LoginRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access_tok"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Should return 401 Unauthorized when password is bad")
    void login_BadCredentials_ReturnsUnauthorized() throws Exception {
        LoginRequest request = new LoginRequest("user@launchly.pro", "wrong_password");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new AppException(HttpStatus.UNAUTHORIZED, "auth.error.invalid_credentials"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/v1/auth/refresh - Should return 200 OK with rotated tokens")
    void refresh_ValidToken_ReturnsOk() throws Exception {
        RefreshRequest request = new RefreshRequest("valid_refresh_token");
        AuthResponse mockResponse = new AuthResponse("new_access_tok", "new_refresh_tok", null);

        when(authService.refreshToken("valid_refresh_token")).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("new_access_tok"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/refresh - Should return 400 Bad Request when refresh token is blank")
    void refresh_BlankToken_ReturnsBadRequest() throws Exception {
        RefreshRequest request = new RefreshRequest("");

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/v1/auth/logout - Should return 204 No Content")
    void logout_ValidToken_ReturnsNoContent() throws Exception {
        RefreshRequest request = new RefreshRequest("token_to_revoke");

        mockMvc.perform(post("/api/v1/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        verify(authService, times(1)).logout("token_to_revoke");
    }

    @Test
    @DisplayName("GET /api/v1/auth/me - Should return 200 OK with user profile")
    void me_AuthenticatedUser_ReturnsOk() throws Exception {
        UserResponse userResponse = mock(UserResponse.class);
        when(userResponse.email()).thenReturn("user@launchly.pro");
        when(authService.getCurrentUser("user@launchly.pro")).thenReturn(userResponse);

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("user@launchly.pro", null, Collections.emptyList());

        mockMvc.perform(get("/api/v1/auth/me").principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("user@launchly.pro"));
    }

    @Test
    @DisplayName("PUT /api/v1/auth/profile - Should update profile and return 200 OK")
    void updateProfile_ValidRequest_ReturnsOk() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest("New Name", "user@launchly.pro", null, null, null);
        UserResponse userResponse = mock(UserResponse.class);
        when(userResponse.name()).thenReturn("New Name");

        when(authService.updateProfile(eq("user@launchly.pro"), any(UpdateProfileRequest.class)))
                .thenReturn(userResponse);

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("user@launchly.pro", null, Collections.emptyList());

        mockMvc.perform(put("/api/v1/auth/profile")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New Name"));
    }

    @Test
    @DisplayName("DELETE /api/v1/auth/account - Should delete account and return 204 No Content")
    void deleteAccount_Success() throws Exception {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("user@launchly.pro", null, Collections.emptyList());

        mockMvc.perform(delete("/api/v1/auth/account").principal(auth))
                .andExpect(status().isNoContent());

        verify(authService, times(1)).deleteAccountByEmail("user@launchly.pro");
    }
}
