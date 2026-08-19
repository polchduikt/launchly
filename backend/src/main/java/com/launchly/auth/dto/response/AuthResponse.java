package com.launchly.auth.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Authentication response containing JWT tokens and user profile")
public record AuthResponse(
        @Schema(description = "JWT Access token for authorizing Bearer requests (15 min lifespan)", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
        String accessToken,

        @Schema(description = "Refresh token for rotating access tokens (7 days lifespan)", example = "4c3d82a1-0e12-45e3-9876-abcdef123456")
        String refreshToken,

        @Schema(description = "Authenticated user profile details")
        UserResponse user
) {}

