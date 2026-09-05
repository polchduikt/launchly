package com.launchly.crm.service.impl;

import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.service.UserAvatarService;
import com.launchly.common.exception.AppException;
import com.launchly.crm.dto.request.ConversationUpdateRequest;
import com.launchly.crm.dto.response.ConversationResponse;
import com.launchly.crm.dto.response.MessageResponse;
import com.launchly.crm.entity.Conversation;
import com.launchly.crm.entity.Message;
import com.launchly.crm.entity.SenderType;
import com.launchly.crm.repository.ConversationRepository;
import com.launchly.crm.repository.MessageRepository;
import com.launchly.crm.service.CrmConversationService;
import com.launchly.crm.websocket.CrmWebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CrmConversationServiceImpl implements CrmConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final BotRepository botRepository;
    private final BotUserRepository botUserRepository;
    private final UserAvatarService userAvatarService;
    private final CrmWebSocketService webSocketService;

    @Override
    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversationsByBot(Long botId, Long userId) {
        verifyBotOwnership(botId, userId);
        List<Conversation> conversations = conversationRepository.findByBotIdOrderByUpdatedAtDesc(botId);
        return toConversationResponseList(conversations);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationResponse> getAllConversations(Long userId) {
        List<Conversation> conversations = conversationRepository.findByBotUserIdOrderByUpdatedAtDesc(userId);
        return toConversationResponseList(conversations);
    }

    @Override
    @Transactional(readOnly = true)
    public ConversationResponse getConversation(Long conversationId, Long userId) {
        Conversation conversation = getConversationOrThrow(conversationId, userId);
        return toConversationResponse(conversation);
    }

    @Override
    @Transactional
    public ConversationResponse updateConversation(Long conversationId, ConversationUpdateRequest request, Long userId) {
        Conversation conversation = getConversationOrThrow(conversationId, userId);

        if (request.status() != null) {
            conversation.setStatus(request.status());
        }
        if (request.unread() != null) {
            conversation.setUnread(request.unread());
        }
        if (request.favorite() != null) {
            conversation.setFavorite(request.favorite());
        }
        if (request.tags() != null) {
            conversation.setTags(request.tags());
        }
        if (request.notes() != null) {
            conversation.setNotes(request.notes());
        }

        conversation = conversationRepository.save(conversation);
        ConversationResponse response = toConversationResponse(conversation);
        MessageResponse wsNotify = new MessageResponse(
                -1L,
                conversation.getId(),
                "status_updated",
                SenderType.OWNER,
                null,
                null,
                LocalDateTime.now(),
                null,
                true
        );
        webSocketService.notifyNewMessage(conversation.getBot().getId(), wsNotify);

        return response;
    }

    @Override
    @Transactional
    public Conversation getOrCreateConversation(Long botId, Long botUserId) {
        return conversationRepository.findByBotIdAndBotUserId(botId, botUserId)
                .orElseGet(() -> {
                    Bot bot = botRepository.findById(botId)
                            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bot not found"));
                    BotUser botUser = botUserRepository.findById(botUserId)
                            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bot user not found"));

                    Conversation conversation = Conversation.builder()
                            .bot(bot)
                            .botUser(botUser)
                            .build();
                    return conversationRepository.save(conversation);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public Conversation getConversationOrThrow(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Conversation not found"));
        verifyBotOwnership(conversation.getBot().getId(), userId);
        return conversation;
    }

    private void verifyBotOwnership(Long botId, Long userId) {
        botRepository.findByIdAndUserId(botId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "Access denied to this bot"));
    }

    private List<ConversationResponse> toConversationResponseList(List<Conversation> conversations) {
        if (conversations == null || conversations.isEmpty()) {
            return List.of();
        }

        List<Long> conversationIds = conversations.stream().map(Conversation::getId).toList();
        Map<Long, Message> latestMessages = new HashMap<>();
        try {
            List<Message> messages = messageRepository.findLatestMessagesByConversationIds(conversationIds);
            for (Message m : messages) {
                if (m.getConversation() != null) {
                    latestMessages.put(m.getConversation().getId(), m);
                }
            }
        } catch (Exception e) {
            log.error("Failed to batch load latest messages for conversations: {}", e.getMessage(), e);
        }

        return conversations.stream()
                .map(c -> toConversationResponseWithLastMessage(c, latestMessages.get(c.getId())))
                .toList();
    }

    private ConversationResponse toConversationResponseWithLastMessage(Conversation conversation, Message last) {
        BotUser botUser = conversation.getBotUser();
        String botUserName = botUser.getFirstName() + (botUser.getLastName() != null ? " " + botUser.getLastName() : "");

        String lastMessage = null;
        LocalDateTime lastMessageAt = null;
        if (last != null) {
            lastMessage = last.getContent();
            lastMessageAt = last.getCreatedAt();
        }

        return new ConversationResponse(
                conversation.getId(),
                conversation.getStatus(),
                conversation.isUnread(),
                conversation.isFavorite(),
                conversation.getTags() != null ? conversation.getTags() : List.of(),
                conversation.getNotes(),
                botUserName,
                botUser.getUsername(),
                botUser.getTelegramId(),
                botUser.getPhotoUrl(),
                lastMessage,
                lastMessageAt,
                conversation.getUpdatedAt(),
                conversation.getBot().getId(),
                conversation.getBot().getName()
        );
    }

    private ConversationResponse toConversationResponse(Conversation conversation) {
        BotUser botUser = conversation.getBotUser();
        if (botUser.getPhotoUrl() == null || botUser.getPhotoUrl().startsWith(com.launchly.bot.constant.TelegramConstants.API_BASE_URL)) {
            userAvatarService.fetchAndSetPhotoUrl(botUser);
        }
        Message last = messageRepository.findFirstByConversationIdOrderByCreatedAtDesc(conversation.getId()).orElse(null);
        return toConversationResponseWithLastMessage(conversation, last);
    }
}
