package com.launchly.crm.service.impl;

import com.launchly.common.exception.AppException;
import com.launchly.crm.dto.request.AddNoteRequest;
import com.launchly.crm.dto.request.SendMessageRequest;
import com.launchly.crm.dto.response.MessageResponse;
import com.launchly.crm.entity.Conversation;
import com.launchly.crm.entity.Message;
import com.launchly.crm.entity.SenderType;
import com.launchly.crm.event.CrmOutgoingMessageEvent;
import com.launchly.crm.mapper.CrmMapper;
import com.launchly.crm.repository.MessageRepository;
import com.launchly.crm.service.CrmConversationService;
import com.launchly.crm.service.CrmMessageService;
import com.launchly.crm.websocket.CrmWebSocketService;
import com.launchly.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CrmMessageServiceImpl implements CrmMessageService {

    private static final Duration SCHEDULED_MESSAGE_LOCK_TIMEOUT = Duration.ofMinutes(5);

    private final MessageRepository messageRepository;
    private final CrmConversationService conversationService;
    private final CrmMapper crmMapper;
    private final CrmWebSocketService webSocketService;
    private final NotificationService notificationService;
    private final StringRedisTemplate stringRedisTemplate;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(Long conversationId, Long userId) {
        Conversation conversation = conversationService.getConversationOrThrow(conversationId, userId);
        List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());
        return crmMapper.toMessageResponseList(messages);
    }

    @Override
    @Transactional
    public MessageResponse saveIncomingMessage(Long botId, Long botUserId, String content) {
        Conversation conversation = conversationService.getOrCreateConversation(botId, botUserId);
        conversation.setUnread(true);

        Message message = Message.builder()
                .content(content)
                .senderType(SenderType.BOT_USER)
                .conversation(conversation)
                .build();
        message = messageRepository.save(message);
        MessageResponse response = crmMapper.toMessageResponse(message);
        webSocketService.notifyNewMessage(botId, response);

        try {
            com.launchly.auth.entity.User botOwner = conversation.getBot().getUser();
            if (botOwner != null) {
                notificationService.sendNewMessageNotification(botOwner.getId(), conversation.getId(), content);
            }
        } catch (Exception e) {
            log.error("Failed to send incoming message notification for conversation {}: {}", conversation.getId(), e.getMessage(), e);
        }

        return response;
    }

    @Override
    @Transactional
    public MessageResponse saveBotMessage(Long botId, Long botUserId, String content) {
        return saveBotMessage(botId, botUserId, content, null, null);
    }

    @Override
    @Transactional
    public MessageResponse saveBotMessage(Long botId, Long botUserId, String content, String mediaUrl, String mediaType) {
        Conversation conversation = conversationService.getOrCreateConversation(botId, botUserId);

        Message message = Message.builder()
                .content(content != null ? content : "")
                .senderType(SenderType.OWNER)
                .mediaUrl(mediaUrl)
                .mediaType(mediaType)
                .conversation(conversation)
                .build();
        message = messageRepository.save(message);
        MessageResponse response = crmMapper.toMessageResponse(message);
        webSocketService.notifyNewMessage(botId, response);
        return response;
    }

    @Override
    @Transactional
    public MessageResponse sendOwnerMessage(Long conversationId, SendMessageRequest request, Long userId) {
        Conversation conversation = conversationService.getConversationOrThrow(conversationId, userId);

        Message.MessageBuilder builder = Message.builder()
                .content(request.content())
                .senderType(SenderType.OWNER)
                .conversation(conversation);

        if (request.mediaUrl() != null && !request.mediaUrl().isBlank()) {
            builder.mediaUrl(request.mediaUrl());
            builder.mediaType(request.mediaType() != null ? request.mediaType() : "image");
        }

        if (request.scheduledAt() != null && request.scheduledAt().isAfter(LocalDateTime.now())) {
            builder.scheduledAt(request.scheduledAt());
            builder.sent(false);
        } else {
            builder.sent(true);
        }

        Message message = builder.build();
        message = messageRepository.save(message);
        log.info("Owner saved message to conversation {} in DB (scheduled={})", conversationId, request.scheduledAt() != null);

        final Message savedMessage = message;
        final MessageResponse response = crmMapper.toMessageResponse(savedMessage);
        final Long botId = conversation.getBot().getId();
        final Long telegramUserId = conversation.getBotUser().getTelegramId();
        final String mediaUrl = request.mediaUrl();
        final String content = request.content();
        final boolean isSent = savedMessage.getSent();

        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    if (isSent) {
                        eventPublisher.publishEvent(new CrmOutgoingMessageEvent(botId, telegramUserId, content, mediaUrl));
                    }
                    webSocketService.notifyNewMessage(botId, response);
                }
            });
        } else {
            if (isSent) {
                eventPublisher.publishEvent(new CrmOutgoingMessageEvent(botId, telegramUserId, content, mediaUrl));
            }
            webSocketService.notifyNewMessage(botId, response);
        }

        return response;
    }

    @Override
    @Transactional
    public MessageResponse addNote(Long conversationId, AddNoteRequest request, Long userId) {
        Conversation conversation = conversationService.getConversationOrThrow(conversationId, userId);

        Message message = Message.builder()
                .content(request.content())
                .senderType(SenderType.NOTE)
                .conversation(conversation)
                .build();
        message = messageRepository.save(message);
        log.info("Owner added note to conversation {} in DB", conversationId);

        MessageResponse response = crmMapper.toMessageResponse(message);
        webSocketService.notifyNewMessage(conversation.getBot().getId(), response);
        return response;
    }

    @Override
    public void sendScheduledMessages() {
        List<Message> dueMessages = messageRepository.findBySentFalseAndScheduledAtBefore(LocalDateTime.now());
        if (dueMessages.isEmpty()) {
            return;
        }

        log.info("Found {} scheduled messages ready to send", dueMessages.size());

        for (Message message : dueMessages) {
            String lockKey = "lock:crm:scheduled:" + message.getId();
            Boolean acquired = stringRedisTemplate.opsForValue().setIfAbsent(lockKey, "1", SCHEDULED_MESSAGE_LOCK_TIMEOUT);
            if (Boolean.FALSE.equals(acquired)) {
                continue;
            }

            try {
                Conversation conversation = message.getConversation();
                eventPublisher.publishEvent(new CrmOutgoingMessageEvent(
                        conversation.getBot().getId(),
                        conversation.getBotUser().getTelegramId(),
                        message.getContent(),
                        message.getMediaUrl()
                ));

                message.setSent(true);
                messageRepository.save(message);
                log.info("Dispatched scheduled message id={}", message.getId());

                MessageResponse response = crmMapper.toMessageResponse(message);
                webSocketService.notifyNewMessage(conversation.getBot().getId(), response);
            } catch (Exception e) {
                log.error("Failed to send scheduled message id={}: {}", message.getId(), e.getMessage(), e);
                stringRedisTemplate.delete(lockKey);
            }
        }
    }
}
