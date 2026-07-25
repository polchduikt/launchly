package com.launchly.admin.controller;

import com.launchly.admin.dto.CreateMessageRequest;
import com.launchly.admin.dto.SupportMessageDto;
import com.launchly.admin.dto.SupportTicketDto;
import com.launchly.admin.service.AdminSupportChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/support-chats")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class AdminSupportChatController {

    private final AdminSupportChatService adminSupportChatService;

    @GetMapping
    public ResponseEntity<Page<SupportTicketDto>> getTickets(
            @RequestParam(required = false, defaultValue = "all") String filter,
            @RequestParam(required = false, defaultValue = "all") String period,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(adminSupportChatService.getSupportTickets(filter, period, search, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupportTicketDto> getTicketDetail(@PathVariable Long id) {
        return ResponseEntity.ok(adminSupportChatService.getSupportTicketDetail(id));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<SupportMessageDto> addMessage(
            @PathVariable Long id,
            @RequestBody CreateMessageRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(adminSupportChatService.addMessage(id, request.getText(), userDetails.getUsername()));
    }

    @PatchMapping("/{id}/favorite")
    public ResponseEntity<SupportTicketDto> toggleFavorite(@PathVariable Long id) {
        return ResponseEntity.ok(adminSupportChatService.toggleFavorite(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<SupportTicketDto> updateStatus(
            @PathVariable Long id,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(adminSupportChatService.updateStatus(id, status));
    }

    @PostMapping("/{id}/claim")
    public ResponseEntity<SupportTicketDto> claimTicket(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(adminSupportChatService.claimTicket(id, userDetails.getUsername()));
    }
}
