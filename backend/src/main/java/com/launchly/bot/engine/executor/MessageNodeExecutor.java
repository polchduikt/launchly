package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.methods.send.SendPhoto;
import org.telegram.telegrambots.meta.api.objects.InputFile;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.InlineKeyboardMarkup;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.InlineKeyboardButton;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.InlineKeyboardRow;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import com.launchly.common.utils.SanitizationUtil;

import java.util.ArrayList;
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
    @SuppressWarnings("unchecked")
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                          Update update, TelegramClient client) {
        Map<String, Object> data = node.data();
        String text = data != null ? (String) data.getOrDefault("text", "...") : "...";
        String imageUrl = data != null ? (String) data.get("imageUrl") : null;
        List<?> buttonsList = data != null ? (List<?>) data.get("buttons") : null;
        String chatId = botUser.getTelegramId().toString();

        if (update != null && update.hasCallbackQuery()) {
            String callbackData = update.getCallbackQuery().getData();
            boolean isButtonOnThisNode = false;

            if (buttonsList != null) {
                for (Object btnObj : buttonsList) {
                    if (btnObj instanceof Map) {
                        Map<String, Object> btn = (Map<String, Object>) btnObj;
                        Object valObj = btn.get("value");
                        String value = valObj instanceof String ? (String) valObj : "";
                        if (callbackData.equals(value)) {
                            isButtonOnThisNode = true;
                            break;
                        }
                    }
                }
            }

            if (isButtonOnThisNode) {
                return edges.stream()
                        .filter(e -> e.source().equals(node.id()) && callbackData.equals(e.sourceHandle()))
                        .findFirst()
                        .map(FlowEdge::target)
                        .orElse(edges.stream()
                                .filter(e -> e.source().equals(node.id()) && (e.sourceHandle() == null || "next".equals(e.sourceHandle())))
                                .findFirst()
                                .map(FlowEdge::target)
                                .orElse(null));
            }
        }

        String sanitizedText = SanitizationUtil.sanitizeForTelegram(text);
        List<InlineKeyboardRow> rows = new ArrayList<>();

        if (buttonsList != null) {
            for (Object btnObj : buttonsList) {
                if (btnObj instanceof Map) {
                    Map<String, Object> btn = (Map<String, Object>) btnObj;
                    Object labelObj = btn.get("label");
                    String label = labelObj instanceof String ? (String) labelObj : "Button";
                    Object valueObj = btn.get("value");
                    String value = valueObj instanceof String ? (String) valueObj : label;
                    InlineKeyboardButton button = InlineKeyboardButton.builder()
                            .text(label)
                            .callbackData(value)
                            .build();
                    rows.add(new InlineKeyboardRow(button));
                }
            }
        }

        InlineKeyboardMarkup markup = rows.isEmpty() ? null : InlineKeyboardMarkup.builder().keyboard(rows).build();

        try {
            if (imageUrl != null && !imageUrl.trim().isEmpty()) {
                SendPhoto sendPhoto = SendPhoto.builder()
                        .chatId(chatId)
                        .photo(new InputFile(imageUrl))
                        .caption(sanitizedText)
                        .replyMarkup(markup)
                        .build();
                client.execute(sendPhoto);
            } else {
                SendMessage message = SendMessage.builder()
                        .chatId(chatId)
                        .text(sanitizedText)
                        .replyMarkup(markup)
                        .build();
                client.execute(message);
            }
        } catch (TelegramApiException e) {
            log.error("Failed to send telegram message for node {}: {}", node.id(), e.getMessage());
            if (imageUrl != null && !imageUrl.trim().isEmpty()) {
                try {
                    SendMessage message = SendMessage.builder()
                            .chatId(chatId)
                            .text(sanitizedText)
                            .replyMarkup(markup)
                            .build();
                    client.execute(message);
                } catch (TelegramApiException ex) {
                    log.error("Fallback text message also failed for node {}: {}", node.id(), ex.getMessage());
                }
            }
        }

        if (!rows.isEmpty()) {
            return null;
        }

        return edges.stream()
                .filter(e -> e.source().equals(node.id()) && (e.sourceHandle() == null || "next".equals(e.sourceHandle())))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);
    }
}
