package com.launchly.crm.controller;

import com.launchly.common.security.CustomUserDetails;
import com.launchly.crm.dto.request.AddNoteRequest;
import com.launchly.crm.dto.request.ConversationUpdateRequest;
import com.launchly.crm.dto.request.LeadUpdateRequest;
import com.launchly.crm.dto.request.OrderUpdateRequest;
import com.launchly.crm.dto.request.SendMessageRequest;
import com.launchly.crm.dto.response.ConversationResponse;
import com.launchly.crm.dto.response.LeadResponse;
import com.launchly.crm.dto.response.MessageResponse;
import com.launchly.crm.dto.response.OrderResponse;
import com.launchly.crm.service.CrmService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;

@RestController
@RequestMapping("/api/v1/crm")
@RequiredArgsConstructor
public class CrmController {

    private final CrmService crmService;

    @GetMapping("/labels")
    public ResponseEntity<List<String>> getLabels(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.getLabels(userDetails.getId()));
    }

    @PostMapping("/labels")
    public ResponseEntity<List<String>> addLabel(
            @RequestBody java.util.Map<String, String> request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.addLabel(request.get("name"), userDetails.getId()));
    }

    @DeleteMapping("/labels/{name}")
    public ResponseEntity<List<String>> deleteLabel(
            @PathVariable String name,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.deleteLabel(name, userDetails.getId()));
    }

    @GetMapping("/bots/{botId}/orders")
    public ResponseEntity<List<OrderResponse>> getOrders(
            @PathVariable Long botId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.getOrdersByBot(botId, userDetails.getId()));
    }

    @PatchMapping("/orders/{orderId}")
    public ResponseEntity<OrderResponse> updateOrder(
            @PathVariable Long orderId,
            @RequestBody @Valid OrderUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.updateOrder(orderId, request, userDetails.getId()));
    }

    @GetMapping("/bots/{botId}/leads")
    public ResponseEntity<List<LeadResponse>> getLeads(
            @PathVariable Long botId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.getLeadsByBot(botId, userDetails.getId()));
    }

    @PatchMapping("/leads/{leadId}")
    public ResponseEntity<LeadResponse> updateLead(
            @PathVariable Long leadId,
            @RequestBody @Valid LeadUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.updateLead(leadId, request, userDetails.getId()));
    }

    @GetMapping("/bots/{botId}/conversations")
    public ResponseEntity<List<ConversationResponse>> getConversations(
            @PathVariable Long botId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.getConversationsByBot(botId, userDetails.getId()));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> getAllConversations(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.getAllConversations(userDetails.getId()));
    }

    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<ConversationResponse> getConversation(
            @PathVariable Long conversationId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.getConversation(conversationId, userDetails.getId()));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<List<MessageResponse>> getMessages(
            @PathVariable Long conversationId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.getMessages(conversationId, userDetails.getId()));
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable Long conversationId,
            @RequestBody @Valid SendMessageRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.sendOwnerMessage(conversationId, request, userDetails.getId()));
    }

    @PatchMapping("/conversations/{conversationId}")
    public ResponseEntity<ConversationResponse> updateConversation(
            @PathVariable Long conversationId,
            @RequestBody @Valid ConversationUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.updateConversation(conversationId, request, userDetails.getId()));
    }
    @PostMapping("/conversations/{conversationId}/notes")
    public ResponseEntity<MessageResponse> addNote(
            @PathVariable Long conversationId,
            @RequestBody @Valid AddNoteRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.addNote(conversationId, request, userDetails.getId()));
    }
}
