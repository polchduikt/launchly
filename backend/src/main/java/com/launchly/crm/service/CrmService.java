package com.launchly.crm.service;

import com.launchly.crm.dto.request.AddNoteRequest;
import com.launchly.crm.dto.request.ConversationUpdateRequest;
import com.launchly.crm.dto.request.LeadUpdateRequest;
import com.launchly.crm.dto.request.OrderUpdateRequest;
import com.launchly.crm.dto.request.SendMessageRequest;
import com.launchly.crm.dto.response.ConversationResponse;
import com.launchly.crm.dto.response.LeadResponse;
import com.launchly.crm.dto.response.MessageResponse;
import com.launchly.crm.dto.response.OrderResponse;
import java.math.BigDecimal;
import java.util.List;

public interface CrmService {

    OrderResponse createOrder(Long botId, Long botUserId, String items, BigDecimal totalAmount, String currency);
    LeadResponse createLead(Long botId, Long botUserId, String name, String email, String phone, String data);
    MessageResponse saveIncomingMessage(Long botId, Long botUserId, String content);
    MessageResponse saveBotMessage(Long botId, Long botUserId, String content);
    MessageResponse saveBotMessage(Long botId, Long botUserId, String content, String mediaUrl, String mediaType);
    List<OrderResponse> getOrdersByBot(Long botId, Long userId);
    OrderResponse updateOrder(Long orderId, OrderUpdateRequest request, Long userId);
    List<LeadResponse> getLeadsByBot(Long botId, Long userId);
    LeadResponse updateLead(Long leadId, LeadUpdateRequest request, Long userId);
    List<ConversationResponse> getConversationsByBot(Long botId, Long userId);
    List<ConversationResponse> getAllConversations(Long userId);
    ConversationResponse getConversation(Long conversationId, Long userId);
    ConversationResponse updateConversation(Long conversationId, ConversationUpdateRequest request, Long userId);
    List<MessageResponse> getMessages(Long conversationId, Long userId);
    MessageResponse sendOwnerMessage(Long conversationId, SendMessageRequest request, Long userId);
    MessageResponse addNote(Long conversationId, AddNoteRequest request, Long userId);
    void sendScheduledMessages();

    List<String> getLabels(Long userId);
    List<String> addLabel(String name, Long userId);
    List<String> deleteLabel(String name, Long userId);
}
