package com.launchly.bot.controller;

import com.launchly.bot.dto.request.InviteMemberRequest;
import com.launchly.bot.dto.request.UpdateMemberRequest;
import com.launchly.bot.dto.response.TeamMemberResponse;
import com.launchly.bot.service.TeamService;
import com.launchly.common.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @GetMapping("/bots/{botId}/members")
    public ResponseEntity<List<TeamMemberResponse>> getTeamMembers(
            @PathVariable Long botId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(teamService.getTeamMembers(botId, userDetails.getId()));
    }

    @PostMapping("/bots/{botId}/invitations")
    public ResponseEntity<TeamMemberResponse> inviteMember(
            @PathVariable Long botId,
            @Valid @RequestBody InviteMemberRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(teamService.inviteMember(botId, request, userDetails.getId()));
    }

    @DeleteMapping("/bots/{botId}/invitations/{id}")
    public ResponseEntity<Void> cancelInvitation(
            @PathVariable Long botId,
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        teamService.cancelInvitation(botId, id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/bots/{botId}/members/{userId}")
    public ResponseEntity<TeamMemberResponse> updateMember(
            @PathVariable Long botId,
            @PathVariable Long userId,
            @Valid @RequestBody UpdateMemberRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(teamService.updateMember(botId, userId, request, userDetails.getId()));
    }

    @DeleteMapping("/bots/{botId}/members/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long botId,
            @PathVariable Long userId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        teamService.removeMember(botId, userId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/bots/invitations/pending")
    public ResponseEntity<List<TeamMemberResponse>> getMyPendingInvitations(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(teamService.getMyPendingInvitations(userDetails.getId()));
    }

    @PostMapping("/bots/invitations/{id}/accept")
    public ResponseEntity<Void> acceptInvitation(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        teamService.acceptInvitation(id, userDetails.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/bots/invitations/{id}/decline")
    public ResponseEntity<Void> declineInvitation(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        teamService.declineInvitation(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }
}
