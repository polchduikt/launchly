package com.launchly.broadcast.controller;

import com.launchly.broadcast.dto.request.CreateCampaignRequest;
import com.launchly.broadcast.dto.request.CreateTagRequest;
import com.launchly.broadcast.dto.response.CampaignResponse;
import com.launchly.broadcast.dto.response.TagResponse;
import com.launchly.broadcast.service.BroadcastService;
import com.launchly.broadcast.service.TagService;
import com.launchly.common.ratelimit.RateLimit;
import com.launchly.common.ratelimit.RateLimitType;
import com.launchly.common.exception.ErrorResponse;
import com.launchly.common.security.CustomUserDetails;
import java.util.concurrent.TimeUnit;
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
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Tag(name = "Broadcast: Campaigns & Tags", description = "Mass message campaigns, scheduled dispatches, and audience tag management")
@RestController
@RequestMapping("/api/v1/broadcast/bots/{botId}")
@RequiredArgsConstructor
public class BroadcastController {

    private final TagService tagService;
    private final BroadcastService broadcastService;

    @Operation(summary = "Get bot tags", description = "Retrieve list of all subscriber tags configured for this bot.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of tags", content = @Content(array = @ArraySchema(schema = @Schema(implementation = TagResponse.class)))),
            @ApiResponse(responseCode = "404", description = "Bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/tags")
    public ResponseEntity<List<TagResponse>> getTags(
            @Parameter(description = "Target Bot ID") @PathVariable Long botId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(tagService.getTagsByBot(botId, userDetails.getId()));
    }

    @Operation(summary = "Create tag", description = "Add a new subscriber segment tag to the bot.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Tag created successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error / duplicate tag", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/tags")
    public ResponseEntity<TagResponse> createTag(
            @Parameter(description = "Target Bot ID") @PathVariable Long botId,
            @Valid @RequestBody CreateTagRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tagService.createTag(botId, userDetails.getId(), request));
    }

    @Operation(summary = "Delete tag", description = "Remove a tag and untag subscribers.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Tag deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Tag not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/tags/{tagId}")
    public ResponseEntity<Void> deleteTag(
            @Parameter(description = "Target Bot ID") @PathVariable Long botId,
            @Parameter(description = "Tag ID") @PathVariable Long tagId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        tagService.deleteTag(tagId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get broadcast campaigns", description = "Retrieve list of all broadcast campaigns created for this bot.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of campaigns", content = @Content(array = @ArraySchema(schema = @Schema(implementation = CampaignResponse.class)))),
            @ApiResponse(responseCode = "404", description = "Bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/campaigns")
    public ResponseEntity<List<CampaignResponse>> getCampaigns(
            @Parameter(description = "Target Bot ID") @PathVariable Long botId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(broadcastService.getCampaigns(botId, userDetails.getId()));
    }

    @Operation(summary = "Create broadcast campaign", description = "Create a draft, immediate, or scheduled mass broadcast campaign.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Campaign created successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Plan quota exceeded", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/campaigns")
    public ResponseEntity<CampaignResponse> createCampaign(
            @Parameter(description = "Target Bot ID") @PathVariable Long botId,
            @Valid @RequestBody CreateCampaignRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(broadcastService.createCampaign(botId, userDetails.getId(), request));
    }

    @Operation(summary = "Update broadcast campaign", description = "Modify content, scheduled time, or audience filters of an unsent campaign.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Campaign updated successfully"),
            @ApiResponse(responseCode = "400", description = "Cannot edit sent campaign", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Campaign not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/campaigns/{campaignId}")
    public ResponseEntity<CampaignResponse> updateCampaign(
            @Parameter(description = "Target Bot ID") @PathVariable Long botId,
            @Parameter(description = "Campaign ID") @PathVariable Long campaignId,
            @Valid @RequestBody CreateCampaignRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(broadcastService.updateCampaign(botId, campaignId, userDetails.getId(), request));
    }

    @Operation(summary = "Send broadcast now", description = "Immediately trigger dispatch for a draft or scheduled campaign.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Campaign dispatch triggered"),
            @ApiResponse(responseCode = "400", description = "Campaign already sent or invalid state", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Campaign not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/campaigns/{campaignId}/send")
    @RateLimit(type = RateLimitType.USER, capacity = 5, duration = 1, unit = TimeUnit.MINUTES, messageKey = "rate_limit.error.broadcast")
    public ResponseEntity<CampaignResponse> sendCampaign(
            @Parameter(description = "Target Bot ID") @PathVariable Long botId,
            @Parameter(description = "Campaign ID") @PathVariable Long campaignId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(broadcastService.sendNow(campaignId, userDetails.getId()));
    }

    @Operation(summary = "Cancel scheduled broadcast", description = "Cancel future automated dispatch for a scheduled campaign.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Scheduled broadcast cancelled"),
            @ApiResponse(responseCode = "404", description = "Campaign not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/campaigns/{campaignId}/schedule")
    public ResponseEntity<CampaignResponse> cancelSchedule(
            @Parameter(description = "Target Bot ID") @PathVariable Long botId,
            @Parameter(description = "Campaign ID") @PathVariable Long campaignId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(broadcastService.cancelSchedule(campaignId, userDetails.getId()));
    }

    @Operation(summary = "Delete broadcast campaign", description = "Permanently remove a broadcast campaign record.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Campaign deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Campaign not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/campaigns/{campaignId}")
    public ResponseEntity<Void> deleteCampaign(
            @Parameter(description = "Target Bot ID") @PathVariable Long botId,
            @Parameter(description = "Campaign ID") @PathVariable Long campaignId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        broadcastService.deleteCampaign(campaignId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }
}

