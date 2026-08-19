package com.launchly.auth.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Telegram QR/deep-link authentication session payload")
public record TelegramSessionResponse(
        @Schema(description = "Unique single-use session auth token", example = "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
        String token,

        @Schema(description = "System Telegram Bot username to connect to", example = "LaunchlyAuthBot")
        String botUsername
) {}

