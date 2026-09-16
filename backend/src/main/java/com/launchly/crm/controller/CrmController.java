package com.launchly.crm.controller;

import com.launchly.common.ratelimit.RateLimit;
import com.launchly.common.ratelimit.RateLimitType;
import com.launchly.common.exception.ErrorResponse;
import com.launchly.common.security.CustomUserDetails;
import com.launchly.crm.dto.request.AddNoteRequest;
import com.launchly.crm.dto.request.ConversationUpdateRequest;
import com.launchly.crm.dto.request.CreateLabelRequest;
import com.launchly.crm.dto.request.LeadUpdateRequest;
import com.launchly.crm.dto.request.OrderUpdateRequest;
import com.launchly.crm.dto.request.SendMessageRequest;
import com.launchly.crm.dto.response.ConversationResponse;
import com.launchly.crm.dto.response.LeadResponse;
import com.launchly.crm.dto.response.MessageResponse;
import com.launchly.crm.dto.response.OrderResponse;
import com.launchly.crm.service.CrmService;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Tag(name = "CRM: Live Chat, Leads & Orders", description = "Live agent inbox, Telegram two-way chat, pipeline leads, order fulfillment, and conversation labels")
@RestController
@RequestMapping("/api/v1/crm")
@RequiredArgsConstructor
public class CrmController {

    private final CrmService crmService;

    @Operation(summary = "Get CRM labels", description = "Retrieve list of custom tags/labels used to categorize inbox conversations.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of labels")
    })
    @GetMapping("/labels")
    public ResponseEntity<List<String>> getLabels(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.getLabels(userDetails.getId()));
    }

    @Operation(summary = "Add CRM label", description = "Create a new custom label for conversation filtering.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Label added successfully")
    })
    @PostMapping("/labels")
    public ResponseEntity<List<String>> addLabel(
            @Valid @RequestBody CreateLabelRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED).body(crmService.addLabel(request.name(), userDetails.getId()));
    }

    @Operation(summary = "Delete CRM label", description = "Remove an existing custom conversation label.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Updated list of labels")
    })
    @DeleteMapping("/labels/{name}")
    public ResponseEntity<Void> deleteLabel(
            @Parameter(description = "Label name") @PathVariable String name,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        crmService.deleteLabel(name, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get bot orders", description = "Retrieve all e-commerce customer orders generated across bot workflows.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of orders", content = @Content(array = @ArraySchema(schema = @Schema(implementation = OrderResponse.class)))),
            @ApiResponse(responseCode = "404", description = "Bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/bots/{botId}/orders")
    public ResponseEntity<List<OrderResponse>> getOrders(
            @Parameter(description = "Bot ID") @PathVariable Long botId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.getOrdersByBot(botId, userDetails.getId()));
    }

    @Operation(summary = "Update order status", description = "Update fulfillment status (PAID, SHIPPED, etc.) and notes for an order.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Order updated successfully"),
            @ApiResponse(responseCode = "404", description = "Order not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PatchMapping("/orders/{orderId}")
    public ResponseEntity<OrderResponse> updateOrder(
            @Parameter(description = "Order ID") @PathVariable Long orderId,
            @RequestBody @Valid OrderUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.updateOrder(orderId, request, userDetails.getId()));
    }

    @Operation(summary = "Get bot leads", description = "Retrieve all captured user leads collected by the bot.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of leads", content = @Content(array = @ArraySchema(schema = @Schema(implementation = LeadResponse.class)))),
            @ApiResponse(responseCode = "404", description = "Bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/bots/{botId}/leads")
    public ResponseEntity<List<LeadResponse>> getLeads(
            @Parameter(description = "Bot ID") @PathVariable Long botId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.getLeadsByBot(botId, userDetails.getId()));
    }

    @Operation(summary = "Update lead pipeline status", description = "Move a lead to a different stage (CONTACTED, QUALIFIED, WON, etc.) and save agent notes.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lead updated successfully"),
            @ApiResponse(responseCode = "404", description = "Lead not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PatchMapping("/leads/{leadId}")
    public ResponseEntity<LeadResponse> updateLead(
            @Parameter(description = "Lead ID") @PathVariable Long leadId,
            @RequestBody @Valid LeadUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.updateLead(leadId, request, userDetails.getId()));
    }

    @Operation(summary = "Get conversations for a bot", description = "Retrieve list of Live Chat conversation threads for a specific bot.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of conversations", content = @Content(array = @ArraySchema(schema = @Schema(implementation = ConversationResponse.class)))),
            @ApiResponse(responseCode = "404", description = "Bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/bots/{botId}/conversations")
    public ResponseEntity<List<ConversationResponse>> getConversations(
            @Parameter(description = "Bot ID") @PathVariable Long botId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.getConversationsByBot(botId, userDetails.getId()));
    }

    @Operation(summary = "Get all workspace conversations", description = "Retrieve unified Live Chat inbox threads across all user's bots.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of all conversations", content = @Content(array = @ArraySchema(schema = @Schema(implementation = ConversationResponse.class))))
    })
    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> getAllConversations(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.getAllConversations(userDetails.getId()));
    }

    @Operation(summary = "Get conversation by ID", description = "Retrieve single Live Chat conversation overview and contact details.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Conversation retrieved"),
            @ApiResponse(responseCode = "404", description = "Conversation not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<ConversationResponse> getConversation(
            @Parameter(description = "Conversation ID") @PathVariable Long conversationId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.getConversation(conversationId, userDetails.getId()));
    }

    @Operation(summary = "Get conversation messages", description = "Retrieve chronological chat history (user messages, bot replies, agent answers) for a conversation.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of messages", content = @Content(array = @ArraySchema(schema = @Schema(implementation = MessageResponse.class)))),
            @ApiResponse(responseCode = "404", description = "Conversation not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<List<MessageResponse>> getMessages(
            @Parameter(description = "Conversation ID") @PathVariable Long conversationId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.getMessages(conversationId, userDetails.getId()));
    }

    @Operation(summary = "Send Live Chat message", description = "Dispatch an agent reply or schedule a message to be sent to the Telegram subscriber.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Message sent / scheduled successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Conversation not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/conversations/{conversationId}/messages")
    @RateLimit(type = RateLimitType.USER, capacity = 30, duration = 1, unit = TimeUnit.MINUTES)
    public ResponseEntity<MessageResponse> sendMessage(
            @Parameter(description = "Conversation ID") @PathVariable Long conversationId,
            @RequestBody @Valid SendMessageRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.sendOwnerMessage(conversationId, request, userDetails.getId()));
    }

    @Operation(summary = "Update conversation state", description = "Change conversation status (OPEN, CLOSED, BOT_ONLY), read status, favorite state, or tags.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Conversation updated"),
            @ApiResponse(responseCode = "404", description = "Conversation not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PatchMapping("/conversations/{conversationId}")
    public ResponseEntity<ConversationResponse> updateConversation(
            @Parameter(description = "Conversation ID") @PathVariable Long conversationId,
            @RequestBody @Valid ConversationUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.updateConversation(conversationId, request, userDetails.getId()));
    }

    @Operation(summary = "Add internal note to conversation", description = "Post an agent-only internal note into the conversation thread (hidden from subscriber).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Note added successfully"),
            @ApiResponse(responseCode = "404", description = "Conversation not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/conversations/{conversationId}/notes")
    public ResponseEntity<MessageResponse> addNote(
            @Parameter(description = "Conversation ID") @PathVariable Long conversationId,
            @RequestBody @Valid AddNoteRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(crmService.addNote(conversationId, request, userDetails.getId()));
    }
}

