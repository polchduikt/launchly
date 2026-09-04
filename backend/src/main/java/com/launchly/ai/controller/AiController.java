package com.launchly.ai.controller;

import com.launchly.ai.dto.request.AiChatRequest;
import com.launchly.ai.dto.request.AiSchemaRequest;
import com.launchly.ai.dto.request.CreateAiSessionRequest;
import com.launchly.ai.dto.request.UpdateAiSessionRequest;
import com.launchly.ai.dto.response.AiChatResponse;
import com.launchly.ai.dto.response.AiChatSessionDetailResponse;
import com.launchly.ai.dto.response.AiChatSessionResponse;
import com.launchly.ai.dto.response.AiSchemaResponse;
import com.launchly.ai.dto.response.AiUsageResponse;
import com.launchly.ai.service.AiService;
import com.launchly.common.idempotency.Idempotent;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Tag(name = "AI: Assistant & Flow Generator", description = "AI-powered chatbot assistant, conversational helper, and automatic workflow schema generation")
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @Operation(summary = "Get user's AI chat sessions", description = "Retrieve list of all saved AI chat sessions for current user ordered by most recently updated.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of AI sessions retrieved"),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/sessions")
    public ResponseEntity<List<AiChatSessionResponse>> getSessions(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(aiService.getSessions(userDetails.getId()));
    }

    @Operation(summary = "Create a new AI chat session", description = "Initializes an empty AI chat session for the current user.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Session created successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/sessions")
    public ResponseEntity<AiChatSessionResponse> createSession(
            @Valid @RequestBody(required = false) CreateAiSessionRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(aiService.createSession(request, userDetails.getId()));
    }

    @Operation(summary = "Get AI chat session details", description = "Retrieve full conversation history for a specific AI chat session.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Session details retrieved"),
            @ApiResponse(responseCode = "404", description = "Session not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/sessions/{id}")
    public ResponseEntity<AiChatSessionDetailResponse> getSessionDetails(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(aiService.getSessionDetails(id, userDetails.getId()));
    }

    @Operation(summary = "Update AI chat session title", description = "Renames an existing AI chat session.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Session title updated"),
            @ApiResponse(responseCode = "404", description = "Session not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PatchMapping("/sessions/{id}")
    public ResponseEntity<AiChatSessionResponse> updateSessionTitle(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateAiSessionRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(aiService.updateSessionTitle(id, request, userDetails.getId()));
    }

    @Operation(summary = "Delete an AI chat session", description = "Deletes an AI chat session and all its messages.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Session deleted"),
            @ApiResponse(responseCode = "404", description = "Session not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/sessions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> deleteSession(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        aiService.deleteSession(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Chat with AI assistant", description = "Send a message prompt and conversation history to the AI assistant to receive guidance, recommendations, or troubleshooting advice.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "AI response successfully generated"),
            @ApiResponse(responseCode = "400", description = "Validation failed / empty message", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Monthly AI token quota limit reached", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/chat")
    @Idempotent
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
    @Idempotent
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

