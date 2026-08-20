package com.launchly.bot.controller;

import com.launchly.bot.service.TelegramWebhookService;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Bot: Webhooks", description = "Telegram Bot API incoming message update webhook gateway")
@RestController
@RequestMapping("/api/v1/telegram/webhook")
@RequiredArgsConstructor
public class TelegramWebhookController {

    private final TelegramWebhookService telegramWebhookService;

    @Operation(summary = "Telegram bot webhook listener", description = "Endpoint configured as the Telegram Webhook callback URL to receive real-time Update payloads (messages, button clicks, callbacks).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Update processed successfully"),
            @ApiResponse(responseCode = "404", description = "Bot worker not found or stopped", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{botId}")
    public ResponseEntity<Void> handleUpdate(
            @Parameter(description = "Target bot ID") @PathVariable Long botId,
            @RequestBody String rawUpdate) {
        telegramWebhookService.processWebhookUpdate(botId, rawUpdate);
        return ResponseEntity.ok().build();
    }
}

