package com.launchly.bot.controller;

import com.launchly.bot.dto.request.BotCreateRequest;
import com.launchly.bot.dto.request.BotUpdateRequest;
import com.launchly.bot.dto.request.BotUserCreateRequest;
import com.launchly.bot.dto.request.BotUserUpdateRequest;
import com.launchly.bot.dto.request.FlowSchemaRequest;
import com.launchly.bot.dto.response.BotDetailResponse;
import com.launchly.bot.dto.response.BotResponse;
import com.launchly.bot.dto.response.BotStatsResponse;
import com.launchly.bot.dto.response.BotUserResponse;
import com.launchly.bot.dto.response.FlowSchemaResponse;
import com.launchly.bot.service.BotService;
import com.launchly.common.idempotency.Idempotent;
import com.launchly.common.ratelimit.RateLimit;
import com.launchly.common.ratelimit.RateLimitType;
import com.launchly.common.exception.ErrorResponse;
import com.launchly.common.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
import java.util.concurrent.TimeUnit;

@Tag(name = "Bot: Management & Builder", description = "Telegram bot lifecycle, visual flow schemas, subscriber contacts, custom fields, and folders")
@RestController
@RequestMapping("/api/v1/bots")
@RequiredArgsConstructor
public class BotController {

    private final BotService botService;

    @Operation(summary = "Create a new bot", description = "Register and create a new Telegram bot under the user's workspace.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Bot created successfully"),
            @ApiResponse(responseCode = "400", description = "Validation failed / invalid token or name", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Plan bot limit exceeded", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping
    @Idempotent
    @RateLimit(type = RateLimitType.USER, capacity = 10, duration = 1, unit = TimeUnit.MINUTES)
    public ResponseEntity<BotResponse> createBot(@Valid @RequestBody BotCreateRequest request,
                                                  @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED).body(botService.createBot(request, userDetails.getId()));
    }

    @Operation(summary = "Get user bots", description = "Retrieve list of all Telegram bots owned by or shared with the authenticated user.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of user bots", content = @Content(array = @ArraySchema(schema = @Schema(implementation = BotResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<List<BotResponse>> getBots(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.getBotsByUser(userDetails.getId()));
    }

    @Operation(summary = "Get bot details by ID", description = "Retrieve complete configuration, credentials, and active flow schema for a bot.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Bot details retrieved"),
            @ApiResponse(responseCode = "404", description = "Bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<BotDetailResponse> getBot(@Parameter(description = "Bot ID") @PathVariable Long id,
                                                     @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.getBotById(id, userDetails.getId()));
    }

    @Operation(summary = "Update bot configuration", description = "Modify bot name, description, avatar, or Telegram token.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Bot updated successfully"),
            @ApiResponse(responseCode = "404", description = "Bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}")
    public ResponseEntity<BotResponse> updateBot(@Parameter(description = "Bot ID") @PathVariable Long id,
                                                  @Valid @RequestBody BotUpdateRequest request,
                                                  @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.updateBot(id, request, userDetails.getId()));
    }

    @Operation(summary = "Delete bot", description = "Permanently delete a bot, unregister Telegram webhooks/polling, and remove associated resources.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Bot deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBot(@Parameter(description = "Bot ID") @PathVariable Long id,
                                           @AuthenticationPrincipal CustomUserDetails userDetails) {
        botService.deleteBot(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Start bot", description = "Start the bot worker (long polling or webhook registration) to begin processing user messages.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Bot started successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid token or configuration", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/start")
    @RateLimit(type = RateLimitType.USER, capacity = 10, duration = 1, unit = TimeUnit.MINUTES)
    public ResponseEntity<BotResponse> startBot(@Parameter(description = "Bot ID") @PathVariable Long id,
                                                 @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.startBot(id, userDetails.getId()));
    }

    @Operation(summary = "Publish bot updates", description = "Apply and activate unpublished flow schema changes to the live running bot.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Bot published successfully"),
            @ApiResponse(responseCode = "404", description = "Bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/publish")
    public ResponseEntity<BotResponse> publishBot(@Parameter(description = "Bot ID") @PathVariable Long id,
                                                   @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.publishBot(id, userDetails.getId()));
    }

    @Operation(summary = "Stop bot", description = "Stop the running bot worker from receiving Telegram updates.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Bot stopped successfully"),
            @ApiResponse(responseCode = "404", description = "Bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/stop")
    @RateLimit(type = RateLimitType.USER, capacity = 10, duration = 1, unit = TimeUnit.MINUTES)
    public ResponseEntity<BotResponse> stopBot(@Parameter(description = "Bot ID") @PathVariable Long id,
                                                @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.stopBot(id, userDetails.getId()));
    }

    @Operation(summary = "Get flow schema", description = "Retrieve the visual workflow schema (nodes and edges) of a bot.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Flow schema retrieved"),
            @ApiResponse(responseCode = "404", description = "Bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}/schema")
    public ResponseEntity<FlowSchemaResponse> getFlowSchema(@Parameter(description = "Bot ID") @PathVariable Long id,
                                                             @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.getFlowSchema(id, userDetails.getId()));
    }

    @Operation(summary = "Save flow schema", description = "Save updated workflow nodes and connection edges in the visual builder.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Flow schema saved successfully"),
            @ApiResponse(responseCode = "400", description = "Validation failed / invalid nodes or edges", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}/schema")
    public ResponseEntity<FlowSchemaResponse> saveFlowSchema(@Parameter(description = "Bot ID") @PathVariable Long id,
                                                              @Valid @RequestBody FlowSchemaRequest request,
                                                              @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.saveFlowSchema(id, request, userDetails.getId()));
    }

    @Operation(summary = "Get bot subscribers", description = "Retrieve list of all subscribers / contacts collected by this bot.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of bot users", content = @Content(array = @ArraySchema(schema = @Schema(implementation = BotUserResponse.class)))),
            @ApiResponse(responseCode = "404", description = "Bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}/users")
    public ResponseEntity<List<BotUserResponse>> getBotUsers(@Parameter(description = "Bot ID") @PathVariable Long id,
                                                              @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.getBotUsers(id, userDetails.getId()));
    }

    @Operation(summary = "Get bot quick statistics", description = "Retrieve subscriber count and online status for a bot.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Bot statistics"),
            @ApiResponse(responseCode = "404", description = "Bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}/stats")
    public ResponseEntity<BotStatsResponse> getBotStats(@Parameter(description = "Bot ID") @PathVariable Long id,
                                                         @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.getBotStats(id, userDetails.getId()));
    }

    @Operation(summary = "Update subscriber contact", description = "Modify contact details, metadata, and tags for a bot subscriber.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Subscriber updated successfully"),
            @ApiResponse(responseCode = "404", description = "Bot or user not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}/users/{userId}")
    public ResponseEntity<BotUserResponse> updateBotUser(@Parameter(description = "Bot ID") @PathVariable Long id,
                                                         @Parameter(description = "Subscriber ID") @PathVariable Long userId,
                                                         @Valid @RequestBody BotUserUpdateRequest request,
                                                         @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.updateBotUser(id, userId, request, userDetails.getId()));
    }

    @Operation(summary = "Delete subscriber contact", description = "Remove a subscriber from the bot's contact list.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Subscriber deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Bot or user not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}/users/{userId}")
    public ResponseEntity<Void> deleteBotUser(@Parameter(description = "Bot ID") @PathVariable Long id,
                                              @Parameter(description = "Subscriber ID") @PathVariable Long userId,
                                              @AuthenticationPrincipal CustomUserDetails userDetails) {
        botService.deleteBotUser(id, userId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Create manual subscriber contact", description = "Manually add a contact to the bot's audience list.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Subscriber created successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/users")
    public ResponseEntity<BotUserResponse> createBotUser(@Parameter(description = "Bot ID") @PathVariable Long id,
                                                         @Valid @RequestBody BotUserCreateRequest request,
                                                         @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED).body(botService.createBotUser(id, request, userDetails.getId()));
    }

    @Operation(summary = "Get custom fields schema", description = "Retrieve custom contact field definitions for the bot.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Custom fields JSON string"),
            @ApiResponse(responseCode = "404", description = "Bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping(value = "/{id}/custom-fields", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getCustomFields(@Parameter(description = "Bot ID") @PathVariable Long id,
                                                   @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.getCustomFields(id, userDetails.getId()));
    }

    @Operation(summary = "Save custom fields schema", description = "Save custom contact field definitions for the bot.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Custom fields updated"),
            @ApiResponse(responseCode = "404", description = "Bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping(value = "/{id}/custom-fields", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> saveCustomFields(@Parameter(description = "Bot ID") @PathVariable Long id,
                                                    @RequestBody String customFieldsJson,
                                                    @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.saveCustomFields(id, customFieldsJson, userDetails.getId()));
    }

    @Operation(summary = "Get automation folders", description = "Retrieve folder structure for organizing automation flows.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Folders JSON string"),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping(value = "/automation-folders", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getAutomationFolders(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.getAutomationFolders(userDetails.getId()));
    }

    @Operation(summary = "Save automation folders", description = "Save customized folder hierarchy for automation flows.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Folders JSON string saved"),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping(value = "/automation-folders", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> saveAutomationFolders(@RequestBody String foldersJson,
                                                         @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(botService.saveAutomationFolders(foldersJson, userDetails.getId()));
    }
}

