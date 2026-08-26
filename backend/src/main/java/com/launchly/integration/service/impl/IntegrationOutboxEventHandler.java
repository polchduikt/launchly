package com.launchly.integration.service.impl;

import com.launchly.common.outbox.OutboxEvent;
import com.launchly.common.outbox.OutboxEventHandler;
import com.launchly.crm.entity.Lead;
import com.launchly.crm.entity.Order;
import com.launchly.crm.repository.LeadRepository;
import com.launchly.crm.repository.OrderRepository;
import com.launchly.integration.service.IntegrationEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class IntegrationOutboxEventHandler implements OutboxEventHandler {

    private final IntegrationEventService integrationEventService;
    private final OrderRepository orderRepository;
    private final LeadRepository leadRepository;

    @Override
    public boolean supports(String aggregateType, String eventType) {
        return ("CRM_ORDER".equals(aggregateType) && "ORDER_CREATED".equals(eventType)) ||
               ("CRM_LEAD".equals(aggregateType) && "LEAD_CREATED".equals(eventType));
    }

    @Override
    public void handle(OutboxEvent event) throws Exception {
        if ("CRM_ORDER".equals(event.getAggregateType())) {
            Long orderId = Long.parseLong(event.getAggregateId());
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order != null) {
                integrationEventService.onOrderCreated(order);
            } else {
                log.warn("Outbox event for order {} skipped because order does not exist", orderId);
            }
        } else if ("CRM_LEAD".equals(event.getAggregateType())) {
            Long leadId = Long.parseLong(event.getAggregateId());
            Lead lead = leadRepository.findById(leadId).orElse(null);
            if (lead != null) {
                integrationEventService.onLeadCreated(lead);
            } else {
                log.warn("Outbox event for lead {} skipped because lead does not exist", leadId);
            }
        }
    }
}
