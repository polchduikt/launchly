package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import com.launchly.common.utils.SanitizationUtil;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class MessageNodeExecutor implements NodeExecutor {

    @Override
    public NodeType getType() {
        return NodeType.MESSAGE;
    }

    @Override
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                          Update update, TelegramClient client) {
        Map<String, Object> data = node.data();
        String text = data != null ? (String) data.getOrDefault("text", "...") : "...";
        String chatId = botUser.getTelegramId().toString();

        String sanitizedText = SanitizationUtil.sanitizeForTelegram(text);

        try {
            SendMessage message = SendMessage.builder()
                    .chatId(chatId)
                    .text(sanitizedText)
                    .build();
            client.execute(message);
        } catch (TelegramApiException e) {
            log.error("Failed to send message to chat {}: {}", chatId, e.getMessage());
        }

        return edges.stream()
                .filter(e -> e.source().equals(node.id()))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);
    }
}
