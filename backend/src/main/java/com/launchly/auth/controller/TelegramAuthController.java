package com.launchly.auth.controller;

import com.launchly.auth.dto.response.TelegramSessionResponse;
import com.launchly.auth.dto.response.TelegramStatusResponse;
import com.launchly.auth.service.AuthService;
import com.launchly.common.ratelimit.RateLimit;
import com.launchly.common.ratelimit.RateLimitType;
import com.launchly.common.exception.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

@Tag(name = "Auth: Telegram Login & Linking", description = "Telegram QR code authentication, bot deep-linking login, and account unlinking")
@RestController
@RequestMapping("/api/v1/auth/telegram")
@RequiredArgsConstructor
public class TelegramAuthController {

    private final AuthService authService;

    @Operation(summary = "Create Telegram auth session", description = "Generate a unique session token and return the system Telegram bot username for deep-link / QR login or linking.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Telegram session generated successfully")
    })
    @PostMapping("/session")
    @RateLimit(type = RateLimitType.IP, capacity = 15, duration = 1, unit = TimeUnit.MINUTES, messageKey = "rate_limit.error.auth")
    public ResponseEntity<TelegramSessionResponse> createSession(
            @Parameter(description = "Whether this session is for subscription checkout linking") @RequestParam(required = false, defaultValue = "false") boolean isSubscription,
            Authentication authentication) {
        String email = (authentication != null && authentication.isAuthenticated()) ? authentication.getName() : null;
        TelegramSessionResponse response = authService.createTelegramSession(email, isSubscription);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Check Telegram session status", description = "Poll the status of a Telegram authentication session (PENDING, SUCCESS, EXPIRED) to receive JWT tokens once confirmed.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Session status result"),
            @ApiResponse(responseCode = "404", description = "Session token not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/status/{token}")
    public ResponseEntity<TelegramStatusResponse> getStatus(
            @Parameter(description = "Unique session auth token") @PathVariable String token) {
        TelegramStatusResponse response = authService.checkTelegramSessionStatus(token);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Unlink Telegram account", description = "Disconnect the linked Telegram account from the authenticated user's profile.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Telegram account unlinked successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/unlink")
    public ResponseEntity<Void> unlink(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            authService.unlinkTelegram(authentication.getName());
        }
        return ResponseEntity.noContent().build();
    }
}

