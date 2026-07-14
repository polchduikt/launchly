package com.launchly.crm.service.impl;

import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.common.exception.AppException;
import com.launchly.crm.dto.request.LeadUpdateRequest;
import com.launchly.crm.dto.request.OrderUpdateRequest;
import com.launchly.crm.dto.request.SendMessageRequest;
import com.launchly.crm.dto.response.ConversationResponse;
import com.launchly.crm.dto.response.LeadResponse;
import com.launchly.crm.dto.response.MessageResponse;
import com.launchly.crm.dto.response.OrderResponse;
import com.launchly.crm.entity.Conversation;
import com.launchly.crm.entity.Lead;
import com.launchly.crm.entity.Message;
import com.launchly.crm.entity.Order;
import com.launchly.crm.entity.SenderType;
import com.launchly.crm.mapper.CrmMapper;
import com.launchly.crm.repository.ConversationRepository;
import com.launchly.integration.service.IntegrationEventService;
import com.launchly.crm.repository.LeadRepository;
import com.launchly.crm.repository.MessageRepository;
import com.launchly.crm.repository.OrderRepository;
import com.launchly.bot.service.TelegramSendService;
import com.launchly.bot.telegram.TelegramBotManager;
import com.launchly.common.utils.EncryptionUtil;
import com.launchly.crm.service.CrmService;
import com.launchly.crm.websocket.CrmWebSocketService;
import com.cloudinary.Cloudinary;
import org.springframework.web.client.RestTemplate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
public class CrmServiceImpl implements CrmService {

    private final OrderRepository orderRepository;
    private final LeadRepository leadRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final BotRepository botRepository;
    private final BotUserRepository botUserRepository;
    private final CrmMapper crmMapper;
    private final CrmWebSocketService webSocketService;
    private final TelegramSendService telegramSendService;
    private final IntegrationEventService integrationEventService;
    private final TelegramBotManager botManager;
    private final EncryptionUtil encryptionUtil;
    private final Cloudinary cloudinary;
    private final com.launchly.notification.service.NotificationService notificationService;
 
    @Autowired
    public CrmServiceImpl(OrderRepository orderRepository,
                          LeadRepository leadRepository,
                          ConversationRepository conversationRepository,
                          MessageRepository messageRepository,
                          BotRepository botRepository,
                          BotUserRepository botUserRepository,
                          CrmMapper crmMapper,
                          CrmWebSocketService webSocketService,
                          TelegramSendService telegramSendService,
                          IntegrationEventService integrationEventService,
                          @Lazy TelegramBotManager botManager,
                          EncryptionUtil encryptionUtil,
                          Cloudinary cloudinary,
                          com.launchly.notification.service.NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.leadRepository = leadRepository;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.botRepository = botRepository;
        this.botUserRepository = botUserRepository;
        this.crmMapper = crmMapper;
        this.webSocketService = webSocketService;
        this.telegramSendService = telegramSendService;
        this.integrationEventService = integrationEventService;
        this.botManager = botManager;
        this.encryptionUtil = encryptionUtil;
        this.cloudinary = cloudinary;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public OrderResponse createOrder(Long botId, Long botUserId, String items,
                                     BigDecimal totalAmount, String currency) {
        Bot bot = botRepository.findById(botId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bot not found"));
        BotUser botUser = botUserRepository.findById(botUserId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bot user not found"));
        Long nextNumber = bot.getOrderSequence() + 1;
        bot.setOrderSequence(nextNumber);
        botRepository.save(bot);
        String orderNumber = "#" + nextNumber;
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .items(items)
                .totalAmount(totalAmount != null ? totalAmount : BigDecimal.ZERO)
                .currency(currency != null ? currency : "UAH")
                .bot(bot)
                .botUser(botUser)
                .build();

        order = orderRepository.save(order);
        log.info("Created order {} for bot {} by bot user {}", orderNumber, botId, botUserId);

        final Order savedOrder = order;
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    integrationEventService.onOrderCreated(savedOrder);
                }
            });
        } else {
            integrationEventService.onOrderCreated(savedOrder);
        }

        OrderResponse response = crmMapper.toOrderResponse(order);
        webSocketService.notifyNewOrder(botId, response);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByBot(Long botId, Long userId) {
        verifyBotOwnership(botId, userId);
        List<Order> orders = orderRepository.findByBotIdOrderByCreatedAtDesc(botId);
        return crmMapper.toOrderResponseList(orders);
    }

    @Override
    @Transactional
    public OrderResponse updateOrder(Long orderId, OrderUpdateRequest request, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Order not found"));

        verifyBotOwnership(order.getBot().getId(), userId);

        if (request.status() != null) {
            order.setStatus(request.status());
        }
        if (request.notes() != null) {
            order.setNotes(request.notes());
        }

        order = orderRepository.save(order);
        log.info("Updated order {} status={}", order.getOrderNumber(), order.getStatus());
        OrderResponse response = crmMapper.toOrderResponse(order);
        webSocketService.notifyOrderUpdate(order.getBot().getId(), response);
        return response;
    }

    @Override
    @Transactional
    public LeadResponse createLead(Long botId, Long botUserId, String name,
                                   String email, String phone, String data) {
        Bot bot = botRepository.findById(botId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bot not found"));
        BotUser botUser = botUserRepository.findById(botUserId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bot user not found"));

        Lead lead = Lead.builder()
                .name(name)
                .email(email)
                .phone(phone)
                .data(data)
                .bot(bot)
                .botUser(botUser)
                .build();

        lead = leadRepository.save(lead);
        log.info("Created lead for bot {} by bot user {}: name={}", botId, botUserId, name);

        final Lead savedLead = lead;
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    integrationEventService.onLeadCreated(savedLead);
                }
            });
        } else {
            integrationEventService.onLeadCreated(savedLead);
        }

        LeadResponse response = crmMapper.toLeadResponse(lead);
        webSocketService.notifyNewLead(botId, response);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeadResponse> getLeadsByBot(Long botId, Long userId) {
        verifyBotOwnership(botId, userId);
        List<Lead> leads = leadRepository.findByBotIdOrderByCreatedAtDesc(botId);
        return crmMapper.toLeadResponseList(leads);
    }

    @Override
    @Transactional
    public LeadResponse updateLead(Long leadId, LeadUpdateRequest request, Long userId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Lead not found"));

        verifyBotOwnership(lead.getBot().getId(), userId);

        if (request.status() != null) {
            lead.setStatus(request.status());
        }
        if (request.notes() != null) {
            lead.setNotes(request.notes());
        }

        lead = leadRepository.save(lead);
        log.info("Updated lead {} status={}", lead.getId(), lead.getStatus());
        LeadResponse response = crmMapper.toLeadResponse(lead);
        webSocketService.notifyLeadUpdate(lead.getBot().getId(), response);
        return response;
    }


    @Override
    @Transactional
    public List<ConversationResponse> getConversationsByBot(Long botId, Long userId) {
        verifyBotOwnership(botId, userId);
        List<Conversation> conversations = conversationRepository.findByBotIdOrderByUpdatedAtDesc(botId);
        return conversations.stream()
                .map(this::toConversationResponse)
                .toList();
    }

    @Override
    @Transactional
    public List<ConversationResponse> getAllConversations(Long userId) {
        List<Conversation> conversations = conversationRepository.findByBotUserIdOrderByUpdatedAtDesc(userId);
        return conversations.stream()
                .map(this::toConversationResponse)
                .toList();
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
                notificationService.sendNewMessageNotification(botOwner, conversation, content);
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

        Message message = builder.build();
        message = messageRepository.save(message);
        log.info("Owner saved message to conversation {} in DB", conversationId);

        if (request.mediaUrl() != null && !request.mediaUrl().isBlank()) {
            telegramSendService.sendPhoto(
                    conversation.getBot().getId(),
                    conversation.getBotUser().getTelegramId(),
                    request.mediaUrl(),
                    request.content()
            );
        } else {
            telegramSendService.sendMessage(
                    conversation.getBot().getId(),
                    conversation.getBotUser().getTelegramId(),
                    request.content()
            );
        }

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

    private ConversationResponse toConversationResponse(Conversation conversation) {
        BotUser botUser = conversation.getBotUser();
        if (botUser.getPhotoUrl() == null || botUser.getPhotoUrl().startsWith("https://api.telegram.org/")) {
            fetchAndSetPhotoUrl(botUser);
        }
        String botUserName = botUser.getFirstName() + (botUser.getLastName() != null ? " " + botUser.getLastName() : "");

        Message last = messageRepository.findFirstByConversationIdOrderByCreatedAtDesc(conversation.getId()).orElse(null);
        String lastMessage = null;
        LocalDateTime lastMessageAt = null;
        if (last != null) {
            lastMessage = last.getContent();
            lastMessageAt = last.getCreatedAt();
        }

        return new ConversationResponse(
                conversation.getId(),
                conversation.getStatus(),
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

    private void fetchAndSetPhotoUrl(BotUser botUser) {
        Long botId = botUser.getBot().getId();
        org.telegram.telegrambots.meta.generics.TelegramClient telegramClient = botManager.getTelegramClient(botId);
        if (telegramClient == null) {
            return;
        }
        try {
            org.telegram.telegrambots.meta.api.methods.GetUserProfilePhotos getUserProfilePhotos =
                    org.telegram.telegrambots.meta.api.methods.GetUserProfilePhotos.builder()
                            .userId(botUser.getTelegramId())
                            .limit(1)
                            .build();
            org.telegram.telegrambots.meta.api.objects.UserProfilePhotos photos = telegramClient.execute(getUserProfilePhotos);
            if (photos != null && photos.getTotalCount() > 0 && photos.getPhotos() != null && !photos.getPhotos().isEmpty()) {
                List<org.telegram.telegrambots.meta.api.objects.PhotoSize> photoSizes = photos.getPhotos().get(0);
                org.telegram.telegrambots.meta.api.objects.PhotoSize largest = photoSizes.stream()
                        .max(Comparator.comparingInt(size -> size.getWidth() * size.getHeight()))
                        .orElse(null);
                if (largest != null) {
                    org.telegram.telegrambots.meta.api.methods.GetFile getFile =
                            org.telegram.telegrambots.meta.api.methods.GetFile.builder()
                                    .fileId(largest.getFileId())
                                    .build();
                    org.telegram.telegrambots.meta.api.objects.File file = telegramClient.execute(getFile);
                    if (file != null && file.getFilePath() != null) {
                        Bot bot = botRepository.findById(botId).orElse(null);
                        if (bot == null) {
                            return;
                        }
                        String botToken = encryptionUtil.decrypt(bot.getTelegramToken());
                        String fileUrl = "https://api.telegram.org/file/bot" + botToken + "/" + file.getFilePath();
                        try {
                            RestTemplate restTemplate = new RestTemplate();
                            byte[] fileBytes = restTemplate.getForObject(fileUrl, byte[].class);
                            if (fileBytes != null && fileBytes.length > 0) {
                                Map<String, Object> params = Map.of(
                                    "folder", "launchly/" + bot.getUser().getId() + "/contacts",
                                    "transformation", "c_limit,w_400,h_400,q_auto,f_auto"
                                );
                                Map<?, ?> result = cloudinary.uploader().upload(fileBytes, params);
                                String secureUrl = (String) result.get("secure_url");
                                botUser.setPhotoUrl(secureUrl);
                            } else {
                                botUser.setPhotoUrl(fileUrl);
                            }
                        } catch (Exception uploadEx) {
                            log.warn("Failed to upload profile photo to Cloudinary: {}", uploadEx.getMessage());
                            botUser.setPhotoUrl(fileUrl);
                        }
                        botUserRepository.save(botUser);
                        log.debug("Fetched profile photo for user {}", botUser.getTelegramId());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch profile photo for user {}: {}", botUser.getTelegramId(), e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ConversationResponse getConversation(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Conversation not found"));
        verifyBotOwnership(conversation.getBot().getId(), userId);
        return toConversationResponse(conversation);
    }

    private void verifyBotOwnership(Long botId, Long userId) {
        botRepository.findByIdAndUserId(botId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "Access denied to this bot"));
    }
}
