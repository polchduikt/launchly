package com.launchly.bot.controller;

import com.launchly.bot.dto.moderation.BotModerationRuleDto;
import com.launchly.bot.dto.moderation.TestModerationRequest;
import com.launchly.bot.dto.moderation.TestModerationResponse;
import com.launchly.bot.dto.moderation.UpdateBotModerationRuleRequest;
import com.launchly.bot.service.BotModerationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Bot: Content Moderation", description = "Anti-spam, anti-forward, anti-link, media mode, and stop-words moderation management")
@RestController
@RequestMapping("/api/v1/bots/{botId}/moderation")
@RequiredArgsConstructor
public class BotModerationController {

    private final BotModerationService moderationService;

    @Operation(summary = "Get bot moderation settings")
    @GetMapping
    public ResponseEntity<BotModerationRuleDto> getModerationSettings(@PathVariable Long botId) {
        return ResponseEntity.ok(moderationService.getModerationSettings(botId));
    }

    @Operation(summary = "Update bot moderation settings")
    @PutMapping
    public ResponseEntity<BotModerationRuleDto> updateModerationSettings(
            @PathVariable Long botId,
            @Valid @RequestBody UpdateBotModerationRuleRequest request) {
        return ResponseEntity.ok(moderationService.updateModerationSettings(botId, request));
    }

    @Operation(summary = "Test text and content against moderation rules")
    @PostMapping("/test")
    public ResponseEntity<TestModerationResponse> testModeration(
            @PathVariable Long botId,
            @Valid @RequestBody TestModerationRequest request) {
        return ResponseEntity.ok(moderationService.testModeration(botId, request));
    }
}
