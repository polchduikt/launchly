package com.launchly.crm.service;

import com.launchly.crm.dto.request.AddNoteRequest;
import com.launchly.crm.dto.request.SendMessageRequest;
import com.launchly.crm.dto.response.MessageResponse;

import java.util.List;

public interface CrmMessageService {

    List<MessageResponse> getMessages(Long conversationId, Long userId);

    MessageResponse saveIncomingMessage(Long botId, Long botUserId, String content);

    MessageResponse saveBotMessage(Long botId, Long botUserId, String content);

    MessageResponse saveBotMessage(Long botId, Long botUserId, String content, String mediaUrl, String mediaType);

    MessageResponse sendOwnerMessage(Long conversationId, SendMessageRequest request, Long userId);

    MessageResponse addNote(Long conversationId, AddNoteRequest request, Long userId);

    void sendScheduledMessages();
}
