package com.launchly.auth.controller;

import com.launchly.auth.dto.request.LoginRequest;
import com.launchly.auth.dto.request.RefreshRequest;
import com.launchly.auth.dto.request.RegisterRequest;
import com.launchly.auth.dto.request.UpdateProfileRequest;
import com.launchly.auth.dto.response.AuthResponse;
import com.launchly.auth.dto.response.UserResponse;
import com.launchly.auth.service.AuthService;
import com.launchly.common.exception.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Auth: Authentication & Profile", description = "Registration, local login, token rotation, user profile, and account settings")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Register new user account", description = "Create a new user account with email, password, and name, returning access and refresh JWT tokens.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "User successfully registered"),
            @ApiResponse(responseCode = "400", description = "Validation error / invalid inputs", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "User with this email already exists", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @Operation(summary = "Log in with email and password", description = "Authenticate an existing user with credentials, returning JWT access & refresh tokens and user profile.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Authentication successful"),
            @ApiResponse(responseCode = "400", description = "Invalid credentials or blocked account", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Bad credentials", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @Operation(summary = "Refresh access token", description = "Exchange a valid refresh token for a newly issued access token and refreshed refresh token.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tokens refreshed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid or expired refresh token", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request.refreshToken()));
    }

    @Operation(summary = "Log out / revoke refresh token", description = "Revoke the active refresh token session, effectively logging out the client.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Logged out successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid token", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshRequest request) {
        authService.logout(request.refreshToken());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get current authenticated user profile", description = "Retrieve the complete user profile and preferences for the currently authenticated user.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Current user profile"),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "User not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication authentication) {
        return ResponseEntity.ok(authService.getCurrentUser(authentication.getName()));
    }

    @Operation(summary = "Update user profile and password", description = "Update user name, email, avatar, or change password.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Profile updated successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error / incorrect current password", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request,
                                                      Authentication authentication) {
        return ResponseEntity.ok(authService.updateProfile(authentication.getName(), request));
    }

    @Operation(summary = "Delete user account", description = "Permanently delete the authenticated user's account and all associated resources.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Account deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/delete-account")
    public ResponseEntity<Void> deleteAccount(Authentication authentication) {
        UserResponse currentUser = authService.getCurrentUser(authentication.getName());
        authService.deleteUserAccount(currentUser.id());
        return ResponseEntity.noContent().build();
    }
}

