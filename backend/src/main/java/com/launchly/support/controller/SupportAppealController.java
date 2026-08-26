package com.launchly.support.controller;

import com.launchly.common.idempotency.Idempotent;
import com.launchly.common.ratelimit.RateLimit;
import com.launchly.common.ratelimit.RateLimitType;
import com.launchly.common.exception.ErrorResponse;
import com.launchly.common.utils.MessageUtils;
import com.launchly.support.dto.SupportAppealRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@Tag(name = "Support: Public Contact Form", description = "Public support appeal submission for prospective or unauthenticated users")
@Slf4j
@RestController
@RequestMapping("/api/v1/support")
@RequiredArgsConstructor
public class SupportAppealController {

    private final MessageUtils messageUtils;

    @Operation(summary = "Submit support appeal / contact message", description = "Send a public contact message to the Launchly support staff.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Appeal submitted successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/appeal")
    @Idempotent
    @RateLimit(type = RateLimitType.IP, capacity = 3, duration = 1, unit = TimeUnit.HOURS, messageKey = "rate_limit.error.support_appeal")
    public ResponseEntity<Map<String, String>> submitAppeal(@Valid @RequestBody SupportAppealRequest request) {
        log.info("Received support appeal from {}: {}", request.getEmail(), request.getMessage());
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", messageUtils.getMessage("support.appeal.success")
        ));
    }
}

