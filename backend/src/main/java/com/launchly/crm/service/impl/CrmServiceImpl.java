package com.launchly.crm.service.impl;

import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.common.exception.AppException;
import com.launchly.crm.dto.request.ConversationUpdateRequest;
import com.launchly.crm.dto.request.LeadUpdateRequest;
import com.launchly.crm.dto.request.OrderUpdateRequest;
import com.launchly.crm.dto.request.AddNoteRequest;
import com.launchly.crm.dto.request.SendMessageRequest;
import com.launchly.crm.dto.response.ConversationResponse;
import com.launchly.crm.dto.response.LeadResponse;
import com.launchly.crm.dto.response.MessageResponse;
import com.launchly.crm.dto.response.OrderResponse;
import com.launchly.crm.entity.Conversation;
import com.launchly.crm.entity.Message;
import com.launchly.crm.entity.SenderType;
import com.launchly.crm.mapper.CrmMapper;
import com.launchly.crm.repository.ConversationRepository;
import com.launchly.crm.repository.MessageRepository;
import com.launchly.bot.service.TelegramSendService;
import com.launchly.common.utils.EncryptionUtil;
import com.launchly.crm.service.CrmPipelineService;
import com.launchly.crm.service.CrmService;
import com.launchly.crm.websocket.CrmWebSocketService;
import com.launchly.bot.service.UserAvatarService;
import com.launchly.auth.repository.UserRepository;
import com.launchly.crm.repository.CrmLabelRepository;
import com.launchly.notification.service.NotificationService;
import org.springframework.data.redis.core.StringRedisTemplate;
import java.time.Duration;
import java.time.LocalDateTime;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Slf4j
@Service
public class CrmServiceImpl implements CrmService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final BotRepository botRepository;
    private final BotUserRepository botUserRepository;
    private final CrmMapper crmMapper;
    private final CrmWebSocketService webSocketService;
    private final TelegramSendService telegramSendService;
    private final EncryptionUtil encryptionUtil;
    private final UserAvatarService userAvatarService;
    private final NotificationService notificationService;
    private final CrmLabelRepository crmLabelRepository;
    private final UserRepository userRepository;
    private final StringRedisTemplate stringRedisTemplate;
    private final CrmPipelineService crmPipelineService;

    public CrmServiceImpl(ConversationRepository conversationRepository,
                          MessageRepository messageRepository,
                          BotRepository botRepository,
                          BotUserRepository botUserRepository,
                          CrmMapper crmMapper,
                          CrmWebSocketService webSocketService,
                          TelegramSendService telegramSendService,
                          EncryptionUtil encryptionUtil,
                          UserAvatarService userAvatarService,
                          NotificationService notificationService,
                          CrmLabelRepository crmLabelRepository,
                          UserRepository userRepository,
                          StringRedisTemplate stringRedisTemplate,
                          CrmPipelineService crmPipelineService) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.botRepository = botRepository;
        this.botUserRepository = botUserRepository;
        this.crmMapper = crmMapper;
        this.webSocketService = webSocketService;
        this.telegramSendService = telegramSendService;
        this.encryptionUtil = encryptionUtil;
        this.userAvatarService = userAvatarService;
        this.notificationService = notificationService;
        this.crmLabelRepository = crmLabelRepository;
        this.userRepository = userRepository;
        this.stringRedisTemplate = stringRedisTemplate;
        this.crmPipelineService = crmPipelineService;
    }

    @Override
    @Transactional
    public OrderResponse createOrder(Long botId, Long botUserId, String items,
                                     BigDecimal totalAmount, String currency) {
        return crmPipelineService.createOrder(botId, botUserId, items, totalAmount, currency);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByBot(Long botId, Long userId) {
        return crmPipelineService.getOrdersByBot(botId, userId);
    }

    @Override
    @Transactional
    public OrderResponse updateOrder(Long orderId, OrderUpdateRequest request, Long userId) {
        return crmPipelineService.updateOrder(orderId, request, userId);
    }

    @Override
    @Transactional
    public LeadResponse createLead(Long botId, Long botUserId, String name,
                                   String email, String phone, String data) {
        return crmPipelineService.createLead(botId, botUserId, name, email, phone, data);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeadResponse> getLeadsByBot(Long botId, Long userId) {
        return crmPipelineService.getLeadsByBot(botId, userId);
    }

    @Override
    @Transactional
    public LeadResponse updateLead(Long leadId, LeadUpdateRequest request, Long userId) {
        return crmPipelineService.updateLead(leadId, request, userId);
    }


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
    public List<MessageResponse> getMessages(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Conversation not found"));
        verifyBotOwnership(conversation.getBot().getId(), userId);
        List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        return crmMapper.toMessageResponseList(messages);
    }

    @Override
    @Transactional
    public MessageResponse saveIncomingMessage(Long botId, Long botUserId, String content) {
        Conversation conversation = getOrCreateConversation(botId, botUserId);
        conversation.setUnread(true);
        conversation = conversationRepository.save(conversation);

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
            log.error("Failed to send incoming message notification", e);
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
        Conversation conversation = getOrCreateConversation(botId, botUserId);

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
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Conversation not found"));
        verifyBotOwnership(conversation.getBot().getId(), userId);

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
                        try {
                            if (mediaUrl != null && !mediaUrl.isBlank()) {
                                telegramSendService.sendPhoto(botId, telegramUserId, mediaUrl, content);
                            } else {
                                telegramSendService.sendMessage(botId, telegramUserId, content);
                            }
                        } catch (Exception e) {
                            log.error("Failed to send telegram message after commit: {}", e.getMessage(), e);
                        }
                    }
                    webSocketService.notifyNewMessage(botId, response);
                }
            });
        } else {
            if (isSent) {
                if (mediaUrl != null && !mediaUrl.isBlank()) {
                    telegramSendService.sendPhoto(botId, telegramUserId, mediaUrl, content);
                } else {
                    telegramSendService.sendMessage(botId, telegramUserId, content);
                }
            }
            webSocketService.notifyNewMessage(botId, response);
        }

        return response;
    }

    @Override
    @Transactional
    public MessageResponse addNote(Long conversationId, AddNoteRequest request, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Conversation not found"));
        verifyBotOwnership(conversation.getBot().getId(), userId);

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


    private Conversation getOrCreateConversation(Long botId, Long botUserId) {
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
            log.error("Failed to batch load latest messages for conversations: {}", e.getMessage());
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
        if (botUser.getPhotoUrl() == null || botUser.getPhotoUrl().startsWith("https://api.telegram.org/")) {
            userAvatarService.fetchAndSetPhotoUrl(botUser);
        }
        Message last = messageRepository.findFirstByConversationIdOrderByCreatedAtDesc(conversation.getId()).orElse(null);
        return toConversationResponseWithLastMessage(conversation, last);
    }

    @Override
    @Transactional(readOnly = true)
    public ConversationResponse getConversation(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Conversation not found"));
        verifyBotOwnership(conversation.getBot().getId(), userId);
        return toConversationResponse(conversation);
    }

    @Override
    @Transactional
    public ConversationResponse updateConversation(Long conversationId, ConversationUpdateRequest request, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Conversation not found"));
        verifyBotOwnership(conversation.getBot().getId(), userId);

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
                "🖱️ status_updated",
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
    @Transactional(readOnly = true)
    public List<String> getLabels(Long userId) {
        return crmLabelRepository.findByUserId(userId).stream()
                .map(com.launchly.crm.entity.CrmLabel::getName)
                .toList();
    }

    @Override
    @Transactional
    public List<String> addLabel(String name, Long userId) {
        if (name != null && !name.isBlank()) {
            String trimmed = name.trim();
            if (crmLabelRepository.findByUserIdAndName(userId, trimmed).isEmpty()) {
                com.launchly.auth.entity.User user = userRepository.findById(userId)
                        .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));
                crmLabelRepository.save(com.launchly.crm.entity.CrmLabel.builder()
                        .name(trimmed)
                        .user(user)
                        .build());
            }
        }
        return getLabels(userId);
    }

    @Override
    @Transactional
    public List<String> deleteLabel(String name, Long userId) {
        if (name != null && !name.isBlank()) {
            crmLabelRepository.deleteByUserIdAndName(userId, name.trim());
        }
        return getLabels(userId);
    }

    private void verifyBotOwnership(Long botId, Long userId) {
        botRepository.findByIdAndUserId(botId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "Access denied to this bot"));
    }

    @Override
    @Transactional
    public void sendScheduledMessages() {
        List<Message> dueMessages = messageRepository.findBySentFalseAndScheduledAtBefore(LocalDateTime.now());
        if (dueMessages.isEmpty()) {
            return;
        }

        log.info("Found {} scheduled messages ready to send", dueMessages.size());

        for (Message message : dueMessages) {
            String lockKey = "lock:crm:scheduled:" + message.getId();
            Boolean acquired = stringRedisTemplate.opsForValue().setIfAbsent(lockKey, "1", Duration.ofMinutes(5));
            if (Boolean.FALSE.equals(acquired)) {
                continue;
            }

            try {
                Conversation conversation = message.getConversation();

                if (message.getMediaUrl() != null && !message.getMediaUrl().isBlank()) {
                    telegramSendService.sendPhoto(
                            conversation.getBot().getId(),
                            conversation.getBotUser().getTelegramId(),
                            message.getMediaUrl(),
                            message.getContent()
                    );
                } else {
                    telegramSendService.sendMessage(
                            conversation.getBot().getId(),
                            conversation.getBotUser().getTelegramId(),
                            message.getContent()
                    );
                }

                message.setSent(true);
                messageRepository.save(message);
                log.info("Dispatched scheduled message id={}", message.getId());

                MessageResponse response = crmMapper.toMessageResponse(message);
                webSocketService.notifyNewMessage(conversation.getBot().getId(), response);
            } catch (Exception e) {
                log.error("Failed to send scheduled message id={}: {}", message.getId(), e.getMessage(), e);
            }
        }
    }
}
