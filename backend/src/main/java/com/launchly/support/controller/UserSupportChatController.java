package com.launchly.support.controller;

import com.launchly.admin.dto.CreateMessageRequest;
import com.launchly.admin.dto.SupportMessageDto;
import com.launchly.admin.dto.SupportTicketDto;
import com.launchly.common.exception.ErrorResponse;
import com.launchly.support.dto.CreateTicketRequest;
import com.launchly.support.service.UserSupportChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Support: User Tickets & Chat", description = "Authenticated user help desk tickets, conversation messages, and status updates")
@RestController
@RequestMapping("/api/v1/support/tickets")
@RequiredArgsConstructor
public class UserSupportChatController {

    private final UserSupportChatService userSupportChatService;

    @Operation(summary = "Get user support tickets", description = "Retrieve paginated list of support tickets opened by the authenticated user.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Page of user support tickets"),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<Page<SupportTicketDto>> getUserTickets(
            @Parameter(description = "Page zero-based index") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userSupportChatService.getUserTickets(userDetails.getUsername(), page, size));
    }

    @Operation(summary = "Open support ticket", description = "Create a new support inquiry ticket.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Ticket created successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping
    public ResponseEntity<SupportTicketDto> createTicket(
            @Valid @RequestBody CreateTicketRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userSupportChatService.createTicket(request, userDetails.getUsername()));
    }

    @Operation(summary = "Get ticket details and chat thread", description = "Retrieve single support ticket including all customer and manager messages.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Support ticket details"),
            @ApiResponse(responseCode = "404", description = "Ticket not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<SupportTicketDto> getTicketDetail(
            @Parameter(description = "Ticket ID") @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userSupportChatService.getUserTicketDetail(id, userDetails.getUsername()));
    }

    @Operation(summary = "Send message in ticket thread", description = "Post a new user reply message in an open support ticket.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Message sent successfully"),
            @ApiResponse(responseCode = "404", description = "Ticket not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/messages")
    public ResponseEntity<SupportMessageDto> addMessage(
            @Parameter(description = "Ticket ID") @PathVariable Long id,
            @Valid @RequestBody CreateMessageRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userSupportChatService.addMessage(id, request.getText(), userDetails.getUsername()));
    }

    @Operation(summary = "Update ticket status (e.g. resolve/close)", description = "Mark a support ticket as resolved or closed.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Ticket status updated"),
            @ApiResponse(responseCode = "404", description = "Ticket not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PatchMapping("/{id}/status")
    public ResponseEntity<SupportTicketDto> updateStatus(
            @Parameter(description = "Ticket ID") @PathVariable Long id,
            @Parameter(description = "Target status: RESOLVED, CLOSED, OPEN") @RequestParam(required = false, defaultValue = "RESOLVED") String status,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userSupportChatService.updateStatus(id, status, userDetails.getUsername()));
    }
}

