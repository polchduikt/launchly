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
public class EndNodeExecutor implements NodeExecutor {

    private final BotDialogStateService stateService;

    @Override
    public NodeType getType() {
        return NodeType.END;
    }

    @Override
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                          Update update, TelegramClient client) {
        Long botId = botUser.getBot().getId();
        Long telegramUserId = botUser.getTelegramId();
        Map<String, Object> data = node.data();
        String text = data != null ? (String) data.getOrDefault("text", null) : null;
        String chatId = botUser.getTelegramId().toString();

        if (text != null && !text.isBlank()) {
            try {
                SendMessage message = SendMessage.builder()
                        .chatId(chatId)
                        .text(text)
                        .build();
                client.execute(message);
            } catch (TelegramApiException e) {
                log.error("Failed to send end message to chat {}: {}", chatId, e.getMessage());
            }
        }

        stateService.clearSession(botId, telegramUserId);
        return null;
    }
}
