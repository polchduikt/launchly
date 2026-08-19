package com.launchly.auth;

import com.launchly.BaseIntegrationTest;
import com.launchly.auth.dto.request.LoginRequest;
import com.launchly.auth.dto.request.RefreshRequest;
import com.launchly.auth.dto.request.RegisterRequest;
import com.launchly.auth.dto.request.UpdateProfileRequest;
import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthIntegrationTest extends BaseIntegrationTest {

    @Test
    @DisplayName("Should successfully register, persist user in DB, and return JWT tokens")
    void register_Success() throws Exception {
        String email = "reg_" + UUID.randomUUID().toString().substring(0, 8) + "@launchly.test";
        RegisterRequest request = new RegisterRequest(email, "StrongPassword123!", "Alex Johnson");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value(email))
                .andExpect(jsonPath("$.user.name").value("Alex Johnson"));

        User userInDb = userRepository.findByEmail(email).orElse(null);
        assertThat(userInDb).isNotNull();
        assertThat(userInDb.getName()).isEqualTo("Alex Johnson");
        assertThat(passwordEncoder.matches("StrongPassword123!", userInDb.getPassword())).isTrue();
    }

    @Test
    @DisplayName("Should reject registration with already registered email")
    void register_DuplicateEmail_ReturnsConflictOrBadRequest() throws Exception {
        User existingUser = createTestUser("dup", Role.ROLE_OWNER);
        RegisterRequest request = new RegisterRequest(existingUser.getEmail(), "StrongPassword123!", "Alex Johnson");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("Should login with correct credentials, generate tokens, and fetch current user profile")
    void login_And_FetchMe_Success() throws Exception {
        User user = createTestUser("login", Role.ROLE_OWNER);
        LoginRequest loginRequest = new LoginRequest(user.getEmail(), "Password123!");

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn();

        String responseJson = result.getResponse().getContentAsString();
        String accessToken = objectMapper.readTree(responseJson).get("accessToken").asText();

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(user.getEmail()))
                .andExpect(jsonPath("$.role").value("ROLE_OWNER"));
    }

    @Test
    @DisplayName("Should reject login with invalid password")
    void login_InvalidPassword_ReturnsUnauthorized() throws Exception {
        User user = createTestUser("badpass", Role.ROLE_OWNER);
        LoginRequest loginRequest = new LoginRequest(user.getEmail(), "WrongPassword!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should refresh access token when given valid refresh token")
    void refreshToken_Success() throws Exception {
        User user = createTestUser("refresh", Role.ROLE_OWNER);
        String refreshToken = tokenService.generateRefreshToken(user);

        RefreshRequest request = new RefreshRequest(refreshToken);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty());
    }

    @Test
    @DisplayName("Should update user profile and persist changes in DB")
    void updateProfile_Success() throws Exception {
        User user = createTestUser("prof", Role.ROLE_OWNER);
        String updatedEmail = "updated_" + user.getEmail();
        UpdateProfileRequest request = new UpdateProfileRequest("Updated Name", updatedEmail, "https://cdn.example.com/avatar.png", null, null);

        mockMvc.perform(put("/api/v1/auth/profile")
                        .header("Authorization", getAuthHeader(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Name"))
                .andExpect(jsonPath("$.email").value(updatedEmail))
                .andExpect(jsonPath("$.avatar").value("https://cdn.example.com/avatar.png"));

        User updatedUser = userRepository.findById(user.getId()).orElseThrow();
        assertThat(updatedUser.getName()).isEqualTo("Updated Name");
        assertThat(updatedUser.getEmail()).isEqualTo(updatedEmail);
        assertThat(updatedUser.getAvatar()).isEqualTo("https://cdn.example.com/avatar.png");
    }

    @Test
    @DisplayName("Should change user password via profile update and verify old password rejected")
    void updatePassword_Success() throws Exception {
        User user = createTestUser("chgpass", Role.ROLE_OWNER);
        UpdateProfileRequest request = new UpdateProfileRequest(user.getName(), user.getEmail(), user.getAvatar(), "Password123!", "NewSecret123!");

        mockMvc.perform(put("/api/v1/auth/profile")
                        .header("Authorization", getAuthHeader(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        LoginRequest oldLogin = new LoginRequest(user.getEmail(), "Password123!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(oldLogin)))
                .andExpect(status().isUnauthorized());

        LoginRequest newLogin = new LoginRequest(user.getEmail(), "NewSecret123!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLogin)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should successfully delete user account")
    void deleteAccount_Success() throws Exception {
        User user = createTestUser("delacc", Role.ROLE_OWNER);

        mockMvc.perform(delete("/api/v1/auth/delete-account")
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().isNoContent());

        assertThat(userRepository.findById(user.getId())).isEmpty();
    }
}
