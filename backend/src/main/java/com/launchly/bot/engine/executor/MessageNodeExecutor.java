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
        List<Map<String, Object>> blocks = null;
        if (data != null && data.get("blocks") instanceof List) {
            blocks = (List<Map<String, Object>>) data.get("blocks");
        }
        String chatId = botUser.getTelegramId().toString();

        if (update != null && update.hasCallbackQuery()) {
            String callbackData = update.getCallbackQuery().getData();
            boolean isButtonOnThisNode = false;

            List<?> buttonsList = data != null ? (List<?>) data.get("buttons") : null;
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

        boolean hasButtons = false;

        if (blocks != null && !blocks.isEmpty()) {
            for (Map<String, Object> block : blocks) {
                String type = (String) block.get("type");
                if (type == null) continue;

                if ("text".equals(type)) {
                    String blockText = (String) block.getOrDefault("text", "");
                    if (blockText == null || blockText.trim().isEmpty()) continue;
                    String sanitized = SanitizationUtil.sanitizeForTelegram(blockText);

                    List<?> blockButtons = (List<?>) block.get("buttons");
                    InlineKeyboardMarkup markup = buildMarkup(blockButtons);
                    if (markup != null) hasButtons = true;

                    try {
                        SendMessage message = SendMessage.builder()
                                .chatId(chatId)
                                .text(sanitized)
                                .replyMarkup(markup)
                                .build();
                        client.execute(message);
                    } catch (TelegramApiException e) {
                        log.error("Failed to send text block in node {}: {}", node.id(), e.getMessage());
                    }

                } else if ("image".equals(type)) {
                    String blockImageUrl = (String) block.get("imageUrl");
                    if (blockImageUrl == null || blockImageUrl.trim().isEmpty()) continue;

                    List<?> blockButtons = (List<?>) block.get("buttons");
                    InlineKeyboardMarkup markup = buildMarkup(blockButtons);
                    if (markup != null) hasButtons = true;

                    try {
                        SendPhoto sendPhoto = SendPhoto.builder()
                                .chatId(chatId)
                                .photo(new InputFile(blockImageUrl))
                                .replyMarkup(markup)
                                .build();
                        client.execute(sendPhoto);
                    } catch (TelegramApiException e) {
                        log.error("Failed to send image block in node {}: {}", node.id(), e.getMessage());
                    }

                } else if ("delay".equals(type)) {
                    int delaySeconds = 3;
                    Object delayObj = block.get("delaySeconds");
                    if (delayObj instanceof Number) {
                        delaySeconds = ((Number) delayObj).intValue();
                    } else if (delayObj instanceof String) {
                        try {
                            delaySeconds = Integer.parseInt((String) delayObj);
                        } catch (NumberFormatException ignored) {}
                    }

                    try {
                        Thread.sleep(delaySeconds * 1000L);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        log.warn("Delay interrupted in node {}", node.id());
                    }

                } else if ("data_collection".equals(type)) {
                    String blockText = (String) block.getOrDefault("text", "");
                    if (blockText == null || blockText.trim().isEmpty()) continue;
                    String sanitized = SanitizationUtil.sanitizeForTelegram(blockText);

                    try {
                        SendMessage message = SendMessage.builder()
                                .chatId(chatId)
                                .text(sanitized)
                                .build();
                        client.execute(message);
                    } catch (TelegramApiException e) {
                        log.error("Failed to send data collection question in node {}: {}", node.id(), e.getMessage());
                    }
                }
            }
        } else {
            String text = data != null ? (String) data.getOrDefault("text", "...") : "...";
            String imageUrl = data != null ? (String) data.get("imageUrl") : null;
            List<?> buttonsList = data != null ? (List<?>) data.get("buttons") : null;

            String sanitizedText = SanitizationUtil.sanitizeForTelegram(text);
            InlineKeyboardMarkup markup = buildMarkup(buttonsList);
            if (markup != null) hasButtons = true;

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
                log.error("Failed to send legacy flat message for node {}: {}", node.id(), e.getMessage());
            }
        }

        if (hasButtons) {
            return null;
        }

        return edges.stream()
                .filter(e -> e.source().equals(node.id()) && (e.sourceHandle() == null || "next".equals(e.sourceHandle())))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);
    }

    private InlineKeyboardMarkup buildMarkup(List<?> buttonsList) {
        if (buttonsList == null || buttonsList.isEmpty()) {
            return null;
        }
        List<InlineKeyboardRow> rows = new ArrayList<>();
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
        return rows.isEmpty() ? null : InlineKeyboardMarkup.builder().keyboard(rows).build();
    }
}
