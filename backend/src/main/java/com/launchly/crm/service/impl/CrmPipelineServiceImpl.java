package com.launchly.crm.service.impl;

import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.common.exception.AppException;
import com.launchly.common.outbox.OutboxService;
import com.launchly.crm.dto.request.LeadUpdateRequest;
import com.launchly.crm.dto.request.OrderUpdateRequest;
import com.launchly.crm.dto.response.LeadResponse;
import com.launchly.crm.dto.response.OrderResponse;
import com.launchly.crm.entity.Lead;
import com.launchly.crm.entity.Order;
import com.launchly.crm.mapper.CrmMapper;
import com.launchly.crm.repository.LeadRepository;
import com.launchly.crm.repository.OrderRepository;
import com.launchly.crm.service.CrmPipelineService;
import com.launchly.crm.websocket.CrmWebSocketService;
import com.launchly.integration.service.IntegrationEventService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
public class CrmPipelineServiceImpl implements CrmPipelineService {

    private final OrderRepository orderRepository;
    private final LeadRepository leadRepository;
    private final BotRepository botRepository;
    private final BotUserRepository botUserRepository;
    private final CrmMapper crmMapper;
    private final CrmWebSocketService webSocketService;
    private final IntegrationEventService integrationEventService;
    private final OutboxService outboxService;

    @Autowired
    public CrmPipelineServiceImpl(OrderRepository orderRepository,
                                  LeadRepository leadRepository,
                                  BotRepository botRepository,
                                  BotUserRepository botUserRepository,
                                  CrmMapper crmMapper,
                                  CrmWebSocketService webSocketService,
                                  IntegrationEventService integrationEventService,
                                  @Autowired(required = false) OutboxService outboxService) {
        this.orderRepository = orderRepository;
        this.leadRepository = leadRepository;
        this.botRepository = botRepository;
        this.botUserRepository = botUserRepository;
        this.crmMapper = crmMapper;
        this.webSocketService = webSocketService;
        this.integrationEventService = integrationEventService;
        this.outboxService = outboxService;
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
        if (outboxService != null) {
            outboxService.publish("CRM_ORDER", String.valueOf(order.getId()), "ORDER_CREATED", response);
        }
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
        if (outboxService != null) {
            outboxService.publish("CRM_LEAD", String.valueOf(lead.getId()), "LEAD_CREATED", response);
        }
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

    private void verifyBotOwnership(Long botId, Long userId) {
        botRepository.findByIdAndUserId(botId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "Access denied to this bot"));
    }
}
