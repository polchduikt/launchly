package com.launchly.crm.service.impl;

import com.launchly.crm.dto.request.AddNoteRequest;
import com.launchly.crm.dto.request.ConversationUpdateRequest;
import com.launchly.crm.dto.request.LeadUpdateRequest;
import com.launchly.crm.dto.request.OrderUpdateRequest;
import com.launchly.crm.dto.request.SendMessageRequest;
import com.launchly.crm.dto.response.ConversationResponse;
import com.launchly.crm.dto.response.LeadResponse;
import com.launchly.crm.dto.response.MessageResponse;
import com.launchly.crm.dto.response.OrderResponse;
import com.launchly.crm.service.CrmConversationService;
import com.launchly.crm.service.CrmLabelService;
import com.launchly.crm.service.CrmMessageService;
import com.launchly.crm.service.CrmPipelineService;
import com.launchly.crm.service.CrmService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CrmServiceImpl implements CrmService {

    private final CrmPipelineService crmPipelineService;
    private final CrmConversationService crmConversationService;
    private final CrmMessageService crmMessageService;
    private final CrmLabelService crmLabelService;

    @Override
    public OrderResponse createOrder(Long botId, Long botUserId, String items,
                                     BigDecimal totalAmount, String currency) {
        return crmPipelineService.createOrder(botId, botUserId, items, totalAmount, currency);
    }

    @Override
    public List<OrderResponse> getOrdersByBot(Long botId, Long userId) {
        return crmPipelineService.getOrdersByBot(botId, userId);
    }

    @Override
    public OrderResponse updateOrder(Long orderId, OrderUpdateRequest request, Long userId) {
        return crmPipelineService.updateOrder(orderId, request, userId);
    }

    @Override
    public LeadResponse createLead(Long botId, Long botUserId, String name,
                                   String email, String phone, String data) {
        return crmPipelineService.createLead(botId, botUserId, name, email, phone, data);
    }

    @Override
    public List<LeadResponse> getLeadsByBot(Long botId, Long userId) {
        return crmPipelineService.getLeadsByBot(botId, userId);
    }

    @Override
    public LeadResponse updateLead(Long leadId, LeadUpdateRequest request, Long userId) {
        return crmPipelineService.updateLead(leadId, request, userId);
    }

    @Override
    public List<ConversationResponse> getConversationsByBot(Long botId, Long userId) {
        return crmConversationService.getConversationsByBot(botId, userId);
    }

    @Override
    public List<ConversationResponse> getAllConversations(Long userId) {
        return crmConversationService.getAllConversations(userId);
    }

    @Override
    public List<MessageResponse> getMessages(Long conversationId, Long userId) {
        return crmMessageService.getMessages(conversationId, userId);
    }

    @Override
    public MessageResponse saveIncomingMessage(Long botId, Long botUserId, String content) {
        return crmMessageService.saveIncomingMessage(botId, botUserId, content);
    }

    @Override
    public MessageResponse saveBotMessage(Long botId, Long botUserId, String content) {
        return crmMessageService.saveBotMessage(botId, botUserId, content);
    }

    @Override
    public MessageResponse saveBotMessage(Long botId, Long botUserId, String content, String mediaUrl, String mediaType) {
        return crmMessageService.saveBotMessage(botId, botUserId, content, mediaUrl, mediaType);
    }

    @Override
    public MessageResponse sendOwnerMessage(Long conversationId, SendMessageRequest request, Long userId) {
        return crmMessageService.sendOwnerMessage(conversationId, request, userId);
    }

    @Override
    public MessageResponse addNote(Long conversationId, AddNoteRequest request, Long userId) {
        return crmMessageService.addNote(conversationId, request, userId);
    }

    @Override
    public ConversationResponse getConversation(Long conversationId, Long userId) {
        return crmConversationService.getConversation(conversationId, userId);
    }

    @Override
    public ConversationResponse updateConversation(Long conversationId, ConversationUpdateRequest request, Long userId) {
        return crmConversationService.updateConversation(conversationId, request, userId);
    }

    @Override
    public List<String> getLabels(Long userId) {
        return crmLabelService.getLabels(userId);
    }

    @Override
    public List<String> addLabel(String name, Long userId) {
        return crmLabelService.addLabel(name, userId);
    }

    @Override
    public List<String> deleteLabel(String name, Long userId) {
        return crmLabelService.deleteLabel(name, userId);
    }

    @Override
    public void sendScheduledMessages() {
        crmMessageService.sendScheduledMessages();
    }
}
