package com.launchly.auth.controller;

import com.launchly.auth.dto.response.TelegramSessionResponse;
import com.launchly.auth.dto.response.TelegramStatusResponse;
import com.launchly.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth/telegram")
@RequiredArgsConstructor
public class TelegramAuthController {

    private final AuthService authService;

    @PostMapping("/session")
    public ResponseEntity<TelegramSessionResponse> createSession(
            @RequestParam(required = false, defaultValue = "false") boolean isSubscription,
            Authentication authentication) {
        String email = (authentication != null && authentication.isAuthenticated()) ? authentication.getName() : null;
        TelegramSessionResponse response = authService.createTelegramSession(email, isSubscription);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status/{token}")
    public ResponseEntity<TelegramStatusResponse> getStatus(@PathVariable String token) {
        TelegramStatusResponse response = authService.checkTelegramSessionStatus(token);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/unlink")
    public ResponseEntity<Void> unlink(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            authService.unlinkTelegram(authentication.getName());
        }
        return ResponseEntity.noContent().build();
    }
}
