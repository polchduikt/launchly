package com.launchly.ai.controller;

import com.launchly.common.security.CustomUserDetails;
import com.launchly.ai.dto.request.AiChatRequest;
import com.launchly.ai.dto.request.AiSchemaRequest;
import com.launchly.ai.dto.response.AiChatResponse;
import com.launchly.ai.dto.response.AiSchemaResponse;
import com.launchly.ai.dto.response.AiUsageResponse;
import com.launchly.ai.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(
            @Valid @RequestBody AiChatRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(aiService.chat(request, userDetails.getId()));
    }

    @PostMapping("/generate-schema")
    public ResponseEntity<AiSchemaResponse> generateSchema(
            @Valid @RequestBody AiSchemaRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(aiService.generateSchema(request, userDetails.getId()));
    }

    @GetMapping("/usage")
    public ResponseEntity<AiUsageResponse> getUsage(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(aiService.getUsage(userDetails.getId()));
    }
}
