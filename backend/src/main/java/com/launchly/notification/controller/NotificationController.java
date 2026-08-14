package com.launchly.notification.controller;

import com.launchly.auth.dto.response.UserResponse;
import com.launchly.notification.service.NotificationService;
import com.launchly.notification.dto.UpdateNotificationSettingsRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PutMapping("/settings")
    public ResponseEntity<UserResponse> updateSettings(
            @Valid @RequestBody UpdateNotificationSettingsRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(notificationService.updateSettings(authentication.getName(), request));
    }

    @PostMapping("/telegram/unlink")
    public ResponseEntity<UserResponse> unlinkTelegram(Authentication authentication) {
        return ResponseEntity.ok(notificationService.unlinkTelegram(authentication.getName()));
    }

    @PutMapping("/timezone")
    public ResponseEntity<UserResponse> updateTimezone(
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        String timezone = body.get("timezone");
        return ResponseEntity.ok(notificationService.updateTimezone(authentication.getName(), timezone));
    }
}
