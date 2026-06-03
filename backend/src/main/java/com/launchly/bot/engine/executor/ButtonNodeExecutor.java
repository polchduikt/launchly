package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.InlineKeyboardMarkup;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.InlineKeyboardButton;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.InlineKeyboardRow;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class ButtonNodeExecutor implements NodeExecutor {

    @Override
    public NodeType getType() {
        return NodeType.BUTTON;
    }

    @Override
    @SuppressWarnings("unchecked")
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                          Update update, TelegramClient client) {
        if (update.hasCallbackQuery()) {
            String callbackData = update.getCallbackQuery().getData();
            return edges.stream()
                    .filter(e -> e.source().equals(node.id()))
                    .filter(e -> callbackData.equals(e.sourceHandle()))
                    .findFirst()
                    .map(FlowEdge::target)
                    .orElse(edges.stream()
                            .filter(e -> e.source().equals(node.id()))
                            .findFirst()
                            .map(FlowEdge::target)
                            .orElse(null));
        }

        Map<String, Object> data = node.data();
        String text = data != null ? (String) data.getOrDefault("text", "Choose an option:") : "Choose an option:";
        List<Map<String, String>> buttons = data != null ? (List<Map<String, String>>) data.getOrDefault("buttons", List.of()) : List.of();
        String chatId = botUser.getTelegramId().toString();

        List<InlineKeyboardRow> rows = new ArrayList<>();
        for (Map<String, String> button : buttons) {
            String label = button.getOrDefault("label", "Button");
            String value = button.getOrDefault("value", label);
            InlineKeyboardButton btn = InlineKeyboardButton.builder()
                    .text(label)
                    .callbackData(value)
                    .build();
            rows.add(new InlineKeyboardRow(btn));
        }

        try {
            SendMessage message = SendMessage.builder()
                    .chatId(chatId)
                    .text(text)
                    .replyMarkup(InlineKeyboardMarkup.builder().keyboard(rows).build())
                    .build();
            client.execute(message);
        } catch (TelegramApiException e) {
            log.error("Failed to send buttons to chat {}: {}", chatId, e.getMessage());
        }

        return null;
    }
}
