package com.launchly.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Credentials payload for user authentication")
public record LoginRequest(

        @Schema(description = "User email address", example = "user@launchly.com", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,

        @Schema(description = "Account password", example = "SecretPass123!", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "Password is required")
        String password,

        @Schema(description = "Cloudflare Turnstile captcha token")
        String turnstileToken
) {
    public LoginRequest(String email, String password) {
        this(email, password, null);
    }
}

