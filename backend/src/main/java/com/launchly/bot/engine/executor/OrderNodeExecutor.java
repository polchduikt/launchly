package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.service.BotDialogStateService;
import com.launchly.crm.service.CrmService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderNodeExecutor implements NodeExecutor {

    private final BotDialogStateService stateService;
    private final CrmService crmService;

    @Override
    public NodeType getType() {
        return NodeType.ORDER;
    }

    @Override
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                          Update update, TelegramClient client) {
        Long botId = botUser.getBot().getId();
        Long telegramUserId = botUser.getTelegramId();
        Map<String, Object> data = node.data();

        String productName = data != null ? (String) data.getOrDefault("productName", "Default Product") : "Default Product";
        String price = data != null ? (String) data.getOrDefault("price", "0") : "0";

        log.info("Processing order for bot user {} (bot {}): product={}, price={}", 
                telegramUserId, botId, productName, price);

        stateService.setSessionData(botId, telegramUserId, "last_order_product", productName);
        stateService.setSessionData(botId, telegramUserId, "last_order_price", price);
        stateService.setSessionData(botId, telegramUserId, "order_status", "created");

        String items = productName;
        BigDecimal totalAmount;
        try {
            totalAmount = new BigDecimal(price);
        } catch (NumberFormatException e) {
            totalAmount = BigDecimal.ZERO;
        }
        String currency = data != null ? (String) data.getOrDefault("currency", "UAH") : "UAH";

        try {
            crmService.createOrder(botId, botUser.getId(), items, totalAmount, currency);
        } catch (Exception e) {
            log.error("Failed to persist order to CRM for bot {}: {}", botId, e.getMessage());
        }

        String text = data != null ? (String) data.get("text") : null;
        if (text == null) {
            text = "Order for " + productName + " (" + price + ") has been placed successfully!";
        }

        String chatId = telegramUserId.toString();
        try {
            SendMessage message = SendMessage.builder()
                    .chatId(chatId)
                    .text(text)
                    .build();
            client.execute(message);
        } catch (TelegramApiException e) {
            log.error("Failed to send order confirmation to chat {}: {}", chatId, e.getMessage());
        }

        return edges.stream()
                .filter(e -> e.source().equals(node.id()))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);
    }
}
