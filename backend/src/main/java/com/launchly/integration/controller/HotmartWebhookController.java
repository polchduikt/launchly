package com.launchly.integration.controller;

import com.launchly.common.exception.ErrorResponse;
import com.launchly.integration.service.HotmartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@Tag(name = "Integration: Hotmart Webhooks", description = "Hotmart e-learning platform incoming purchase/refund event processing")
@Slf4j
@RestController
@RequestMapping("/api/v1/integrations/hotmart")
@RequiredArgsConstructor
public class HotmartWebhookController {

    private final HotmartService hotmartService;

    @Operation(summary = "Hotmart event webhook callback", description = "Receives signed purchase events from Hotmart to grant or revoke bot subscriber course access.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Hotmart webhook processed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid token or malformed payload", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/webhook")
    public ResponseEntity<Map<String, String>> handleWebhook(
            @Parameter(description = "Target Bot ID") @RequestParam(name = "botId") Long botId,
            @Parameter(description = "Hotmart security token header") @RequestHeader(name = "X-Hotmart-Hottok", required = false) String hottokHeader,
            @RequestBody String rawPayload
    ) {
        hotmartService.processWebhook(botId, hottokHeader, rawPayload);
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Webhook processed successfully"));
    }
}

