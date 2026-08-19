package com.launchly.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Token refresh / logout payload containing refresh token")
public record RefreshRequest(

        @Schema(description = "Refresh token string", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "Refresh token is required")
        String refreshToken
) {}

