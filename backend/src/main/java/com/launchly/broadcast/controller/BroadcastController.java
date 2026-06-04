package com.launchly.broadcast.controller;

import com.launchly.broadcast.dto.request.CreateCampaignRequest;
import com.launchly.broadcast.dto.request.CreateTagRequest;
import com.launchly.broadcast.dto.response.CampaignResponse;
import com.launchly.broadcast.dto.response.TagResponse;
import com.launchly.broadcast.service.BroadcastService;
import com.launchly.broadcast.service.TagService;
import com.launchly.common.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/broadcast/bots/{botId}")
@RequiredArgsConstructor
public class BroadcastController {

    private final TagService tagService;
    private final BroadcastService broadcastService;

    @GetMapping("/tags")
    public ResponseEntity<List<TagResponse>> getTags(
            @PathVariable Long botId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(tagService.getTagsByBot(botId, userDetails.getId()));
    }

    @PostMapping("/tags")
    public ResponseEntity<TagResponse> createTag(
            @PathVariable Long botId,
            @Valid @RequestBody CreateTagRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tagService.createTag(botId, userDetails.getId(), request));
    }

    @DeleteMapping("/tags/{tagId}")
    public ResponseEntity<Void> deleteTag(
            @PathVariable Long botId,
            @PathVariable Long tagId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        tagService.deleteTag(tagId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/campaigns")
    public ResponseEntity<List<CampaignResponse>> getCampaigns(
            @PathVariable Long botId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(broadcastService.getCampaigns(botId, userDetails.getId()));
    }

    @PostMapping("/campaigns")
    public ResponseEntity<CampaignResponse> createCampaign(
            @PathVariable Long botId,
            @Valid @RequestBody CreateCampaignRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(broadcastService.createCampaign(botId, userDetails.getId(), request));
    }

    @PostMapping("/campaigns/{campaignId}/send")
    public ResponseEntity<CampaignResponse> sendCampaign(
            @PathVariable Long botId,
            @PathVariable Long campaignId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(broadcastService.sendNow(campaignId, userDetails.getId()));
    }
}
