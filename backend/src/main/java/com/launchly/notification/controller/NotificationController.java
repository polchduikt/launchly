package com.launchly.notification.controller;

import com.launchly.auth.dto.response.UserResponse;
import com.launchly.common.exception.ErrorResponse;
import com.launchly.notification.dto.UpdateNotificationSettingsRequest;
import com.launchly.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Tag(name = "Notification: User Settings & Alerts", description = "Email & Telegram notification channels, timezone settings, and automated bot digest schedules")
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @Operation(summary = "Update notification preferences", description = "Configure channels (email/Telegram), alert addresses, and scheduled automated digest timing.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Settings updated successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/settings")
    public ResponseEntity<UserResponse> updateSettings(
            @Valid @RequestBody UpdateNotificationSettingsRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(notificationService.updateSettings(authentication.getName(), request));
    }

    @Operation(summary = "Unlink Telegram notification bot", description = "Disconnect linked Telegram account from receiving automated alert messages.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Telegram unlinked successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/telegram/unlink")
    public ResponseEntity<UserResponse> unlinkTelegram(Authentication authentication) {
        return ResponseEntity.ok(notificationService.unlinkTelegram(authentication.getName()));
    }

    @Operation(summary = "Update user timezone", description = "Set preferred IANA timezone (e.g. Europe/Kyiv, America/New_York) for date formatting and scheduled digests.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Timezone updated successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/timezone")
    public ResponseEntity<UserResponse> updateTimezone(
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        String timezone = body.get("timezone");
        return ResponseEntity.ok(notificationService.updateTimezone(authentication.getName(), timezone));
    }
}

