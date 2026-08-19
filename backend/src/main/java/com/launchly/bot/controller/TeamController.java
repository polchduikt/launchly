package com.launchly.bot.controller;

import com.launchly.bot.dto.request.InviteMemberRequest;
import com.launchly.bot.dto.request.TransferOwnershipRequest;
import com.launchly.bot.dto.request.UpdateMemberRequest;
import com.launchly.bot.dto.response.TeamMemberResponse;
import com.launchly.bot.service.TeamService;
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
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Tag(name = "Bot: Team & Collaboration", description = "Team members, role permissions, invitation flow, and bot ownership transfer")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @Operation(summary = "Get bot team members", description = "Retrieve list of all active members and pending invitations for a specific bot.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of team members", content = @Content(array = @ArraySchema(schema = @Schema(implementation = TeamMemberResponse.class)))),
            @ApiResponse(responseCode = "404", description = "Bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/bots/{botId}/members")
    public ResponseEntity<List<TeamMemberResponse>> getTeamMembers(
            @Parameter(description = "Bot ID") @PathVariable Long botId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(teamService.getTeamMembers(botId, userDetails.getId()));
    }

    @Operation(summary = "Invite team member", description = "Send an invitation to collaborate on a bot with specified role and seat permissions.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Invitation sent successfully"),
            @ApiResponse(responseCode = "400", description = "User already a member or pending invitation exists", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/bots/{botId}/invitations")
    public ResponseEntity<TeamMemberResponse> inviteMember(
            @Parameter(description = "Bot ID") @PathVariable Long botId,
            @Valid @RequestBody InviteMemberRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(teamService.inviteMember(botId, request, userDetails.getId()));
    }

    @Operation(summary = "Cancel pending invitation", description = "Revoke an outgoing pending team invitation.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Invitation cancelled"),
            @ApiResponse(responseCode = "404", description = "Invitation not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/bots/{botId}/invitations/{id}")
    public ResponseEntity<Void> cancelInvitation(
            @Parameter(description = "Bot ID") @PathVariable Long botId,
            @Parameter(description = "Invitation ID") @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        teamService.cancelInvitation(botId, id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Update member role and permissions", description = "Modify role (ADMIN, EDITOR, VIEWER, SUPPORT) or permissions of an existing bot team member.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Member updated successfully"),
            @ApiResponse(responseCode = "404", description = "Member or bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/bots/{botId}/members/{userId}")
    public ResponseEntity<TeamMemberResponse> updateMember(
            @Parameter(description = "Bot ID") @PathVariable Long botId,
            @Parameter(description = "Member user ID") @PathVariable Long userId,
            @Valid @RequestBody UpdateMemberRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(teamService.updateMember(botId, userId, request, userDetails.getId()));
    }

    @Operation(summary = "Remove team member", description = "Revoke access and remove a team member from collaborating on the bot.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Member removed successfully"),
            @ApiResponse(responseCode = "404", description = "Member not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/bots/{botId}/members/{userId}")
    public ResponseEntity<Void> removeMember(
            @Parameter(description = "Bot ID") @PathVariable Long botId,
            @Parameter(description = "Member user ID") @PathVariable Long userId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        teamService.removeMember(botId, userId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get user's pending bot invitations", description = "List all incoming bot collaboration invitations for the currently authenticated user.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of pending invitations", content = @Content(array = @ArraySchema(schema = @Schema(implementation = TeamMemberResponse.class))))
    })
    @GetMapping("/bots/invitations/pending")
    public ResponseEntity<List<TeamMemberResponse>> getMyPendingInvitations(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(teamService.getMyPendingInvitations(userDetails.getId()));
    }

    @Operation(summary = "Accept bot invitation", description = "Accept an incoming invitation to join a bot's collaboration team.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Invitation accepted"),
            @ApiResponse(responseCode = "404", description = "Invitation not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/bots/invitations/{id}/accept")
    public ResponseEntity<Void> acceptInvitation(
            @Parameter(description = "Invitation ID") @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        teamService.acceptInvitation(id, userDetails.getId());
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Decline bot invitation", description = "Decline an incoming bot collaboration invitation.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Invitation declined"),
            @ApiResponse(responseCode = "404", description = "Invitation not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/bots/invitations/{id}/decline")
    public ResponseEntity<Void> declineInvitation(
            @Parameter(description = "Invitation ID") @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        teamService.declineInvitation(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Transfer bot primary ownership", description = "Transfer primary ownership of a bot to another registered team member.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Ownership transferred successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid new owner or not owner of bot", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/bots/{botId}/transfer-ownership")
    public ResponseEntity<Void> transferOwnership(
            @Parameter(description = "Bot ID") @PathVariable Long botId,
            @Valid @RequestBody TransferOwnershipRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        teamService.transferOwnership(botId, request.getNewOwnerUserId(), userDetails.getId());
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Leave bot team", description = "Voluntarily leave a bot collaboration team.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Left bot team successfully"),
            @ApiResponse(responseCode = "400", description = "Owner cannot leave without transferring ownership first", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/bots/{botId}/leave")
    public ResponseEntity<Void> leaveBot(
            @Parameter(description = "Bot ID") @PathVariable Long botId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        teamService.leaveBot(botId, userDetails.getId());
        return ResponseEntity.ok().build();
    }
}

