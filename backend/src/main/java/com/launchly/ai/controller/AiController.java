package com.launchly.ai.controller;

import com.launchly.ai.dto.request.AiChatRequest;
import com.launchly.ai.dto.request.AiSchemaRequest;
import com.launchly.ai.dto.response.AiChatResponse;
import com.launchly.ai.dto.response.AiSchemaResponse;
import com.launchly.ai.dto.response.AiUsageResponse;
import com.launchly.ai.service.AiService;
import com.launchly.common.ratelimit.RateLimit;
import com.launchly.common.ratelimit.RateLimitType;
import com.launchly.common.exception.ErrorResponse;
import com.launchly.common.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

@Tag(name = "AI: Assistant & Flow Generator", description = "AI-powered chatbot assistant, conversational helper, and automatic workflow schema generation")
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @Operation(summary = "Chat with AI assistant", description = "Send a message prompt and conversation history to the AI assistant to receive guidance, recommendations, or troubleshooting advice.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "AI response successfully generated"),
            @ApiResponse(responseCode = "400", description = "Validation failed / empty message", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Monthly AI token quota limit reached", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/chat")
    @RateLimit(type = RateLimitType.USER, capacity = 15, duration = 1, unit = TimeUnit.MINUTES, messageKey = "rate_limit.error.ai")
    public ResponseEntity<AiChatResponse> chat(
            @Valid @RequestBody AiChatRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(aiService.chat(request, userDetails.getId()));
    }

    @Operation(summary = "Generate chatbot flow schema", description = "Generate interactive chatbot node blocks and connection edges from a natural language text description.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Flow schema successfully generated"),
            @ApiResponse(responseCode = "400", description = "Validation failed / empty description", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Monthly AI token quota limit reached", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/generate-schema")
    @RateLimit(type = RateLimitType.USER, capacity = 10, duration = 1, unit = TimeUnit.MINUTES, messageKey = "rate_limit.error.ai")
    public ResponseEntity<AiSchemaResponse> generateSchema(
            @Valid @RequestBody AiSchemaRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(aiService.generateSchema(request, userDetails.getId()));
    }

    @Operation(summary = "Get current AI token usage", description = "Retrieve token consumption metrics, monthly plan quota, remaining tokens, and quota reset date.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "AI token usage retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/usage")
    public ResponseEntity<AiUsageResponse> getUsage(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(aiService.getUsage(userDetails.getId()));
    }
}

