package com.launchly.bot.controller;

import com.launchly.bot.dto.request.BotCreateRequest;
import com.launchly.bot.dto.request.BotUpdateRequest;
import com.launchly.bot.dto.request.BotUserUpdateRequest;
import com.launchly.bot.dto.request.FlowSchemaRequest;
import com.launchly.bot.dto.response.BotDetailResponse;
import com.launchly.bot.dto.response.BotResponse;
import com.launchly.bot.dto.response.BotStatsResponse;
import com.launchly.bot.dto.response.BotUserResponse;
import com.launchly.bot.dto.response.FlowSchemaResponse;
import com.launchly.bot.service.BotService;
import com.launchly.common.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/v1/bots")
@RequiredArgsConstructor
public class BotController {

    private final BotService botService;

    @PostMapping
    public ResponseEntity<BotResponse> createBot(@Valid @RequestBody BotCreateRequest request,
                                                  @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED).body(botService.createBot(request, userDetails.getId()));
    }

    @GetMapping
    public ResponseEntity<List<BotResponse>> getBots(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.getBotsByUser(userDetails.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BotDetailResponse> getBot(@PathVariable Long id,
                                                     @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.getBotById(id, userDetails.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BotResponse> updateBot(@PathVariable Long id,
                                                  @Valid @RequestBody BotUpdateRequest request,
                                                  @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.updateBot(id, request, userDetails.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBot(@PathVariable Long id,
                                           @AuthenticationPrincipal CustomUserDetails userDetails) {
        botService.deleteBot(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<BotResponse> startBot(@PathVariable Long id,
                                                 @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.startBot(id, userDetails.getId()));
    }

    @PostMapping("/{id}/stop")
    public ResponseEntity<BotResponse> stopBot(@PathVariable Long id,
                                                @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.stopBot(id, userDetails.getId()));
    }

    @GetMapping("/{id}/schema")
    public ResponseEntity<FlowSchemaResponse> getFlowSchema(@PathVariable Long id,
                                                             @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.getFlowSchema(id, userDetails.getId()));
    }

    @PutMapping("/{id}/schema")
    public ResponseEntity<FlowSchemaResponse> saveFlowSchema(@PathVariable Long id,
                                                              @Valid @RequestBody FlowSchemaRequest request,
                                                              @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.saveFlowSchema(id, request, userDetails.getId()));
    }

    @GetMapping("/{id}/users")
    public ResponseEntity<List<BotUserResponse>> getBotUsers(@PathVariable Long id,
                                                              @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.getBotUsers(id, userDetails.getId()));
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<BotStatsResponse> getBotStats(@PathVariable Long id,
                                                         @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.getBotStats(id, userDetails.getId()));
    }

    @PutMapping("/{id}/users/{userId}")
    public ResponseEntity<BotUserResponse> updateBotUser(@PathVariable Long id,
                                                         @PathVariable Long userId,
                                                         @Valid @RequestBody BotUserUpdateRequest request,
                                                         @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.updateBotUser(id, userId, request, userDetails.getId()));
    }

    @DeleteMapping("/{id}/users/{userId}")
    public ResponseEntity<Void> deleteBotUser(@PathVariable Long id,
                                              @PathVariable Long userId,
                                              @AuthenticationPrincipal CustomUserDetails userDetails) {
        botService.deleteBotUser(id, userId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }
}
