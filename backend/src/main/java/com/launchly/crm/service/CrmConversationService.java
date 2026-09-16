package com.launchly.crm.service;

import com.launchly.crm.dto.request.ConversationUpdateRequest;
import com.launchly.crm.dto.response.ConversationResponse;
import com.launchly.crm.entity.Conversation;

import java.util.List;

public interface CrmConversationService {

    List<ConversationResponse> getConversationsByBot(Long botId, Long userId);

    List<ConversationResponse> getAllConversations(Long userId);

    ConversationResponse getConversation(Long conversationId, Long userId);

    ConversationResponse updateConversation(Long conversationId, ConversationUpdateRequest request, Long userId);

    Conversation getOrCreateConversation(Long botId, Long botUserId);

    Conversation getConversationOrThrow(Long conversationId, Long userId);
}
