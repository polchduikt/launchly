package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.service.BotDialogStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class LeadNodeExecutor implements NodeExecutor {

    private final BotDialogStateService stateService;

    @Override
    public NodeType getType() {
        return NodeType.LEAD;
    }

    @Override
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                          Update update, TelegramClient client) {
        Long botId = botUser.getBot().getId();
        Long telegramUserId = botUser.getTelegramId();
        Map<String, Object> data = node.data();
        Map<String, String> sessionData = stateService.getSessionData(botId, telegramUserId);

        String name = data != null && data.containsKey("name") ? (String) data.get("name") 
                : sessionData.getOrDefault("name", botUser.getFirstName() + " " + botUser.getLastName());
        String email = data != null && data.containsKey("email") ? (String) data.get("email") 
                : sessionData.getOrDefault("email", "");
        String phone = data != null && data.containsKey("phone") ? (String) data.get("phone") 
                : sessionData.getOrDefault("phone", "");

        log.info("Processing lead for bot user {} (bot {}): name={}, email={}, phone={}", 
                telegramUserId, botId, name, email, phone);

        stateService.setSessionData(botId, telegramUserId, "lead_name", name);
        stateService.setSessionData(botId, telegramUserId, "lead_email", email);
        stateService.setSessionData(botId, telegramUserId, "lead_phone", phone);
        stateService.setSessionData(botId, telegramUserId, "lead_status", "registered");

        String text = data != null ? (String) data.get("text") : null;
        if (text == null) {
            text = "Thank you! Your contact information has been registered.";
        }

        String chatId = telegramUserId.toString();
        try {
            SendMessage message = SendMessage.builder()
                    .chatId(chatId)
                    .text(text)
                    .build();
            client.execute(message);
        } catch (TelegramApiException e) {
            log.error("Failed to send lead registration confirmation to chat {}: {}", chatId, e.getMessage());
        }

        return edges.stream()
                .filter(e -> e.source().equals(node.id()))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);
    }
}
