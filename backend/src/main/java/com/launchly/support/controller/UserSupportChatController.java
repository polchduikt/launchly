package com.launchly.support.controller;

import com.launchly.admin.dto.CreateMessageRequest;
import com.launchly.admin.dto.SupportMessageDto;
import com.launchly.admin.dto.SupportTicketDto;
import com.launchly.support.dto.CreateTicketRequest;
import com.launchly.support.service.UserSupportChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/support/tickets")
@RequiredArgsConstructor
public class UserSupportChatController {

    private final UserSupportChatService userSupportChatService;

    @GetMapping
    public ResponseEntity<Page<SupportTicketDto>> getUserTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userSupportChatService.getUserTickets(userDetails.getUsername(), page, size));
    }

    @PostMapping
    public ResponseEntity<SupportTicketDto> createTicket(
            @Valid @RequestBody CreateTicketRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userSupportChatService.createTicket(request, userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupportTicketDto> getTicketDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userSupportChatService.getUserTicketDetail(id, userDetails.getUsername()));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<SupportMessageDto> addMessage(
            @PathVariable Long id,
            @Valid @RequestBody CreateMessageRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userSupportChatService.addMessage(id, request.getText(), userDetails.getUsername()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<SupportTicketDto> updateStatus(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "RESOLVED") String status,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userSupportChatService.updateStatus(id, status, userDetails.getUsername()));
    }
}
