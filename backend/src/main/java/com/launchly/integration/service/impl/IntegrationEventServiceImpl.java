package com.launchly.integration.service.impl;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.launchly.crm.entity.Lead;
import com.launchly.crm.entity.Order;
import com.launchly.crm.repository.LeadRepository;
import com.launchly.crm.repository.OrderRepository;
import com.launchly.integration.entity.Integration;
import com.launchly.integration.entity.IntegrationType;
import com.launchly.integration.repository.IntegrationRepository;
import com.launchly.integration.service.GoogleSheetsService;
import com.launchly.integration.service.IntegrationEventService;
import com.launchly.integration.dto.request.WebhookConfig;
import com.launchly.integration.service.WebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class IntegrationEventServiceImpl implements IntegrationEventService {

    private final IntegrationRepository integrationRepository;
    private final OrderRepository orderRepository;
    private final LeadRepository leadRepository;
    private final GoogleSheetsService googleSheetsService;
    private final WebhookService webhookService;
    private final com.launchly.integration.service.MailchimpService mailchimpService;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    @Async
    @Transactional(readOnly = true)
    public void onOrderCreated(Order order) {
        Order fullOrder = orderRepository.findById(order.getId()).orElse(null);
        if (fullOrder == null) {
            log.warn("onOrderCreated event triggered with invalid order id {}", order.getId());
            return;
        }

        List<Integration> integrations = integrationRepository.findAllByBotIdAndActiveTrue(fullOrder.getBot().getId());

        for (Integration integration : integrations) {
            try {
                if (integration.getType() == IntegrationType.GOOGLE_SHEETS) {
                    processGoogleSheetsOrder(integration, fullOrder);
                } else if (integration.getType() == IntegrationType.WEBHOOK) {
                    processWebhookOrder(integration, fullOrder);
                } else if (integration.getType() == IntegrationType.MAILCHIMP) {
                    processMailchimpOrder(integration, fullOrder);
                }
            } catch (Exception e) {
                log.error("Error processing order integration {} for bot {}: {}",
                        integration.getId(), fullOrder.getBot().getId(), e.getMessage(), e);
            }
        }
    }

    @Override
    @Async
    @Transactional(readOnly = true)
    public void onLeadCreated(Lead lead) {
        Lead fullLead = leadRepository.findById(lead.getId()).orElse(null);
        if (fullLead == null) {
            log.warn("onLeadCreated event triggered with invalid lead id {}", lead.getId());
            return;
        }

        List<Integration> integrations = integrationRepository.findAllByBotIdAndActiveTrue(fullLead.getBot().getId());

        for (Integration integration : integrations) {
            try {
                if (integration.getType() == IntegrationType.GOOGLE_SHEETS) {
                    processGoogleSheetsLead(integration, fullLead);
                } else if (integration.getType() == IntegrationType.WEBHOOK) {
                    processWebhookLead(integration, fullLead);
                } else if (integration.getType() == IntegrationType.MAILCHIMP) {
                    processMailchimpLead(integration, fullLead);
                }
            } catch (Exception e) {
                log.error("Error processing lead integration {} for bot {}: {}",
                        integration.getId(), fullLead.getBot().getId(), e.getMessage(), e);
            }
        }
    }

    private void processMailchimpLead(Integration integration, Lead lead) {
        if (lead.getEmail() != null && !lead.getEmail().trim().isEmpty()) {
            String firstName = lead.getName() != null ? lead.getName() : "";
            String lastName = "";
            if (firstName.contains(" ")) {
                String[] parts = firstName.split(" ", 2);
                firstName = parts[0];
                lastName = parts[1];
            }
            mailchimpService.addOrUpdateSubscriber(integration, lead.getEmail().trim(), firstName, lastName, lead.getPhone(), List.of("Launchly-Lead"));
        }
    }

    private void processMailchimpOrder(Integration integration, Order order) {
        if (order.getBotUser() != null) {
            String email = null;
            if (order.getNotes() != null && order.getNotes().contains("@")) {
                for (String word : order.getNotes().split("\\s+")) {
                    if (word.contains("@")) {
                        email = word.replaceAll("[^a-zA-Z0-9@._-]", "");
                        break;
                    }
                }
            }
            if (email != null && !email.trim().isEmpty()) {
                mailchimpService.addOrUpdateSubscriber(integration, email.trim(), order.getBotUser().getFirstName(), order.getBotUser().getLastName(), null, List.of("Launchly-Customer"));
            }
        }
    }

    private void processGoogleSheetsOrder(Integration integration, Order order) throws Exception {
        String configStr = integration.getConfig();
        if (configStr == null) return;

        JsonNode configNode = objectMapper.readTree(configStr);
        String dataType = configNode.path("dataType").asText(null);

        if ("ORDERS".equalsIgnoreCase(dataType)) {
            String customerName = "";
            if (order.getBotUser() != null) {
                String firstName = order.getBotUser().getFirstName() != null ? order.getBotUser().getFirstName() : "";
                String lastName = order.getBotUser().getLastName() != null ? order.getBotUser().getLastName() : "";
                customerName = (firstName + " " + lastName).trim();
            }

            List<Object> row = List.of(
                    order.getId() != null ? order.getId() : 0L,
                    order.getOrderNumber() != null ? order.getOrderNumber() : "",
                    order.getStatus() != null ? order.getStatus().name() : "",
                    order.getTotalAmount() != null ? order.getTotalAmount().doubleValue() : 0.0,
                    order.getCurrency() != null ? order.getCurrency() : "",
                    order.getNotes() != null ? order.getNotes() : "",
                    order.getItems() != null ? order.getItems() : "",
                    order.getBotUser() != null && order.getBotUser().getTelegramId() != null ? order.getBotUser().getTelegramId() : 0L,
                    customerName,
                    order.getCreatedAt() != null ? order.getCreatedAt().format(DATE_FORMATTER) : ""
            );
            googleSheetsService.appendRow(integration, null, null, row);
        }
    }

    private void processGoogleSheetsLead(Integration integration, Lead lead) throws Exception {
        String configStr = integration.getConfig();
        if (configStr == null) return;

        JsonNode configNode = objectMapper.readTree(configStr);
        String dataType = configNode.path("dataType").asText(null);

        if ("LEADS".equalsIgnoreCase(dataType)) {
            List<Object> row = List.of(
                    lead.getId() != null ? lead.getId() : 0L,
                    lead.getName() != null ? lead.getName() : "",
                    lead.getEmail() != null ? lead.getEmail() : "",
                    lead.getPhone() != null ? lead.getPhone() : "",
                    lead.getSource() != null ? lead.getSource() : "",
                    lead.getStatus() != null ? lead.getStatus().name() : "",
                    lead.getNotes() != null ? lead.getNotes() : "",
                    lead.getData() != null ? lead.getData() : "",
                    lead.getBotUser() != null && lead.getBotUser().getTelegramId() != null ? lead.getBotUser().getTelegramId() : 0L,
                    lead.getCreatedAt() != null ? lead.getCreatedAt().format(DATE_FORMATTER) : ""
            );
            googleSheetsService.appendRow(integration, null, null, row);
        }
    }

    private WebhookConfig parseWebhookConfig(Integration integration) {
        String configStr = integration.getConfig();
        if (configStr == null) return null;
        try {
            return objectMapper.readValue(configStr, WebhookConfig.class);
        } catch (Exception e) {
            log.error("Failed to parse Webhook config for integration {}: {}", integration.getId(), e.getMessage());
            return null;
        }
    }

    private boolean hasEvent(WebhookConfig config, String targetEvent) {
        if (config == null || config.url() == null || config.url().trim().isEmpty() || config.events() == null) {
            return false;
        }
        for (String event : config.events()) {
            if (targetEvent.equalsIgnoreCase(event)) {
                return true;
            }
        }
        return false;
    }

    private void sendWebhookIfEnabled(Integration integration, String eventName, Map<String, Object> payload) throws Exception {
        WebhookConfig config = parseWebhookConfig(integration);
        if (config != null && hasEvent(config, eventName)) {
            payload.put("eventId", eventName);
            webhookService.send(config.url(), config.secret(), objectMapper.writeValueAsString(payload));
        }
    }

    private void processWebhookOrder(Integration integration, Order order) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", order.getId());
        payload.put("orderNumber", order.getOrderNumber());
        payload.put("status", order.getStatus() != null ? order.getStatus().name() : "");
        payload.put("totalAmount", order.getTotalAmount() != null ? order.getTotalAmount() : 0.0);
        payload.put("currency", order.getCurrency() != null ? order.getCurrency() : "");
        payload.put("notes", order.getNotes() != null ? order.getNotes() : "");
        payload.put("items", order.getItems() != null ? order.getItems() : "[]");

        Map<String, Object> customer = new HashMap<>();
        if (order.getBotUser() != null) {
            customer.put("telegramId", order.getBotUser().getTelegramId());
            customer.put("username", order.getBotUser().getUsername() != null ? order.getBotUser().getUsername() : "");
            customer.put("firstName", order.getBotUser().getFirstName() != null ? order.getBotUser().getFirstName() : "");
            customer.put("lastName", order.getBotUser().getLastName() != null ? order.getBotUser().getLastName() : "");
        }
        payload.put("customer", customer);
        payload.put("createdAt", order.getCreatedAt() != null ? order.getCreatedAt().toString() : "");

        sendWebhookIfEnabled(integration, "ORDER_CREATED", payload);
    }

    private void processWebhookLead(Integration integration, Lead lead) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", lead.getId());
        payload.put("name", lead.getName() != null ? lead.getName() : "");
        payload.put("email", lead.getEmail() != null ? lead.getEmail() : "");
        payload.put("phone", lead.getPhone() != null ? lead.getPhone() : "");
        payload.put("source", lead.getSource() != null ? lead.getSource() : "");
        payload.put("status", lead.getStatus() != null ? lead.getStatus().name() : "");
        payload.put("notes", lead.getNotes() != null ? lead.getNotes() : "");
        payload.put("data", lead.getData() != null ? lead.getData() : "{}");
        Map<String, Object> customer = new HashMap<>();
        if (lead.getBotUser() != null) {
            customer.put("telegramId", lead.getBotUser().getTelegramId());
        }
        payload.put("customer", customer);
        payload.put("createdAt", lead.getCreatedAt() != null ? lead.getCreatedAt().toString() : "");

        sendWebhookIfEnabled(integration, "LEAD_CREATED", payload);
    }
}
