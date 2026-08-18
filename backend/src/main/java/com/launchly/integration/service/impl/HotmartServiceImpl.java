package com.launchly.integration.service.impl;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.common.exception.AppException;
import com.launchly.crm.entity.Lead;
import com.launchly.crm.entity.LeadStatus;
import com.launchly.crm.entity.Order;
import com.launchly.crm.entity.OrderStatus;
import com.launchly.crm.repository.LeadRepository;
import com.launchly.crm.repository.OrderRepository;
import com.launchly.integration.dto.request.HotmartConfig;
import com.launchly.integration.entity.Integration;
import com.launchly.integration.entity.IntegrationType;
import com.launchly.integration.repository.IntegrationRepository;
import com.launchly.integration.service.HotmartService;
import com.launchly.integration.service.IntegrationEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class HotmartServiceImpl implements HotmartService {

    private final IntegrationRepository integrationRepository;
    private final BotRepository botRepository;
    private final BotUserRepository botUserRepository;
    private final LeadRepository leadRepository;
    private final OrderRepository orderRepository;
    private final IntegrationEventService integrationEventService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void processWebhook(Long botId, String tokenHeader, String rawPayload) {
        if (botId == null || rawPayload == null || rawPayload.trim().isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "integration.error.hotmart_missing_payload");
        }

        Bot bot = botRepository.findById(botId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "bot.error.not_found"));

        Integration integration = integrationRepository.findByBotIdAndType(botId, IntegrationType.HOTMART)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "integration.error.hotmart_not_configured"));

        if (!integration.isActive() || integration.getConfig() == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "integration.error.hotmart_inactive");
        }

        HotmartConfig config;
        try {
            config = objectMapper.readValue(integration.getConfig(), HotmartConfig.class);
        } catch (Exception e) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "integration.error.hotmart_invalid_config");
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(rawPayload);
        } catch (Exception e) {
            throw new AppException(HttpStatus.BAD_REQUEST, "common.error.invalid_input");
        }

        String payloadToken = root.path("hottok").asText(null);
        String providedToken = (tokenHeader != null && !tokenHeader.trim().isEmpty()) ? tokenHeader.trim() : payloadToken;

        if (config.hottok() == null || !config.hottok().trim().equalsIgnoreCase(providedToken != null ? providedToken.trim() : "")) {
            log.warn("Unauthorized Hotmart webhook attempt for bot {}. Expected token mismatch.", botId);
            throw new AppException(HttpStatus.UNAUTHORIZED, "integration.error.hotmart_invalid_token");
        }


        String event = root.path("event").asText("");
        JsonNode dataNode = root.path("data");
        if (dataNode.isMissingNode() || dataNode.isNull()) {
            dataNode = root;
        }

        JsonNode buyerNode = dataNode.path("buyer");
        String buyerName = buyerNode.path("name").asText(root.path("first_name").asText("") + " " + root.path("last_name").asText("")).trim();
        String buyerEmail = buyerNode.path("email").asText(root.path("email").asText("")).trim();
        String buyerPhone = buyerNode.path("checkout_phone").asText(buyerNode.path("phone").asText(root.path("phone_number").asText(""))).trim();

        JsonNode productNode = dataNode.path("product");
        String productName = productNode.path("name").asText(root.path("prod_name").asText("Hotmart Product"));

        JsonNode purchaseNode = dataNode.path("purchase");
        String purchaseStatus = purchaseNode.path("status").asText(event);
        double priceValue = purchaseNode.path("price").path("value").asDouble(purchaseNode.path("original_offer_price").path("value").asDouble(root.path("price").asDouble(0.0)));
        String currency = purchaseNode.path("price").path("currency_value").asText(root.path("currency_code").asText("USD"));
        String transactionId = purchaseNode.path("transaction").asText(root.path("transaction").asText(String.valueOf(System.currentTimeMillis())));

        Long syntheticTelegramId = (long) Math.abs(buyerEmail.hashCode());
        if (syntheticTelegramId == 0L) {
            syntheticTelegramId = 999999000L + System.currentTimeMillis() % 100000;
        }

        Long finalTelegramId = syntheticTelegramId;
        BotUser botUser = botUserRepository.findByTelegramIdAndBotId(finalTelegramId, botId)
                .orElseGet(() -> {
                    String[] nameParts = buyerName.split(" ", 2);
                    String fName = nameParts.length > 0 ? nameParts[0] : "Hotmart";
                    String lName = nameParts.length > 1 ? nameParts[1] : "Customer";
                    return botUserRepository.save(BotUser.builder()
                            .bot(bot)
                            .telegramId(finalTelegramId)
                            .firstName(fName)
                            .lastName(lName)
                            .build());
                });

        Lead lead = Lead.builder()
                .bot(bot)
                .botUser(botUser)
                .name(buyerName.isEmpty() ? "Hotmart Buyer" : buyerName)
                .email(buyerEmail)
                .phone(buyerPhone)
                .source("HOTMART")
                .status(LeadStatus.NEW)
                .notes("Hotmart Transaction: " + transactionId + ", Product: " + productName)
                .build();
        lead = leadRepository.save(lead);
        integrationEventService.onLeadCreated(lead);

        Long nextNumber = bot.getOrderSequence() + 1;
        bot.setOrderSequence(nextNumber);
        botRepository.save(bot);

        OrderStatus orderStatus = OrderStatus.COMPLETED;
        if ("REFUND".equalsIgnoreCase(event) || "REFUNDED".equalsIgnoreCase(purchaseStatus)) {
            orderStatus = OrderStatus.CANCELLED;
        } else if ("WAITING_PAYMENT".equalsIgnoreCase(purchaseStatus) || "PENDING".equalsIgnoreCase(purchaseStatus)) {
            orderStatus = OrderStatus.NEW;
        }

        Order order = Order.builder()
                .bot(bot)
                .botUser(botUser)
                .orderNumber("#" + nextNumber)
                .status(orderStatus)
                .totalAmount(BigDecimal.valueOf(priceValue))
                .currency(currency)
                .items("[{\"name\":\"" + productName + "\",\"transaction\":\"" + transactionId + "\"}]")
                .notes("Hotmart Webhook: " + event + " | Tx: " + transactionId)
                .build();
        order = orderRepository.save(order);
        integrationEventService.onOrderCreated(order);

        log.info("Successfully processed Hotmart webhook for bot {}, order {}, buyer {}", botId, order.getOrderNumber(), buyerEmail);
    }
}
