package com.launchly.admin.controller;

import com.launchly.admin.dto.CreateMessageRequest;
import com.launchly.admin.dto.SupportMessageDto;
import com.launchly.admin.dto.SupportTicketDto;
import com.launchly.admin.service.AdminSupportChatService;
import com.launchly.common.exception.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Admin: Support Chats", description = "Customer support tickets, appeals, manager claims, and live conversation")
@RestController
@RequestMapping("/api/v1/admin/support-chats")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class AdminSupportChatController {

    private final AdminSupportChatService adminSupportChatService;

    @Operation(summary = "Get support tickets list", description = "Retrieve a paginated list of support tickets with status filter (all, open, pending, closed, unassigned), period filter, and search.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved support tickets"),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires MANAGER role", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<Page<SupportTicketDto>> getTickets(
            @Parameter(description = "Filter by ticket state: all, open, pending, closed, unassigned") @RequestParam(required = false, defaultValue = "all") String filter,
            @Parameter(description = "Time period filter: all, today, 7d, 30d") @RequestParam(required = false, defaultValue = "all") String period,
            @Parameter(description = "Search term by user email or ticket subject") @RequestParam(required = false) String search,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(adminSupportChatService.getSupportTickets(filter, period, search, page, size));
    }

    @Operation(summary = "Get support ticket details", description = "Retrieve full ticket information including message history and user appeal data.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Ticket details retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Ticket not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires MANAGER role", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<SupportTicketDto> getTicketDetail(@Parameter(description = "Ticket ID") @PathVariable Long id) {
        return ResponseEntity.ok(adminSupportChatService.getSupportTicketDetail(id));
    }

    @Operation(summary = "Send message in support ticket", description = "Post a response message to a support ticket on behalf of the manager.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Message sent successfully"),
            @ApiResponse(responseCode = "400", description = "Cannot send message in closed ticket", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Ticket not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires MANAGER role", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/messages")
    public ResponseEntity<SupportMessageDto> addMessage(
            @Parameter(description = "Ticket ID") @PathVariable Long id,
            @RequestBody CreateMessageRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(adminSupportChatService.addMessage(id, request.getText(), userDetails.getUsername()));
    }

    @Operation(summary = "Toggle favorite state of ticket", description = "Mark or unmark a support ticket as favorite for quick access.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Favorite state toggled successfully"),
            @ApiResponse(responseCode = "404", description = "Ticket not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires MANAGER role", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PatchMapping("/{id}/favorite")
    public ResponseEntity<SupportTicketDto> toggleFavorite(@Parameter(description = "Ticket ID") @PathVariable Long id) {
        return ResponseEntity.ok(adminSupportChatService.toggleFavorite(id));
    }

    @Operation(summary = "Update ticket status", description = "Update the status of a support ticket (e.g. OPEN, PENDING, CLOSED).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Status updated successfully"),
            @ApiResponse(responseCode = "404", description = "Ticket not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires MANAGER role", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PatchMapping("/{id}/status")
    public ResponseEntity<SupportTicketDto> updateStatus(
            @Parameter(description = "Ticket ID") @PathVariable Long id,
            @Parameter(description = "New status: OPEN, PENDING, CLOSED") @RequestParam(required = false) String status) {
        return ResponseEntity.ok(adminSupportChatService.updateStatus(id, status));
    }

    @Operation(summary = "Claim support ticket", description = "Assign the support ticket to the currently logged in manager.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Ticket claimed successfully"),
            @ApiResponse(responseCode = "404", description = "Ticket not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires MANAGER role", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/claim")
    public ResponseEntity<SupportTicketDto> claimTicket(
            @Parameter(description = "Ticket ID") @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(adminSupportChatService.claimTicket(id, userDetails.getUsername()));
    }
}

