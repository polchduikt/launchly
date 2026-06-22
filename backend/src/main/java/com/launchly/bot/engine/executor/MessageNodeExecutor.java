package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.methods.send.SendPhoto;
import org.telegram.telegrambots.meta.api.methods.send.SendDocument;
import org.telegram.telegrambots.meta.api.methods.send.SendAudio;
import org.telegram.telegrambots.meta.api.methods.send.SendVideo;
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

            List<Object> allButtons = new ArrayList<>();
            List<?> topLevelButtons = data != null ? (List<?>) data.get("buttons") : null;
            if (topLevelButtons != null) {
                allButtons.addAll(topLevelButtons);
            }
            if (blocks != null) {
                for (Map<String, Object> block : blocks) {
                    List<?> blockButtons = (List<?>) block.get("buttons");
                    if (blockButtons != null) {
                        allButtons.addAll(blockButtons);
                    }
                }
            }

            if (!allButtons.isEmpty()) {
                for (Object btnObj : allButtons) {
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

        List<?> menuButtons = null;
        if (blocks != null) {
            for (Map<String, Object> block : blocks) {
                if ("telegram_menu".equals(block.get("type"))) {
                    menuButtons = (List<?>) block.get("buttons");
                    break;
                }
            }
        }

        int lastSendableIdx = -1;
        if (blocks != null) {
            for (int i = 0; i < blocks.size(); i++) {
                String type = (String) blocks.get(i).get("type");
                if ("text".equals(type) || "image".equals(type) || "file".equals(type) || "audio".equals(type) || "video".equals(type)) {
                    lastSendableIdx = i;
                }
            }
        }

        if (blocks != null && !blocks.isEmpty()) {
            int blockIdx = 0;
            for (Map<String, Object> block : blocks) {
                String type = (String) block.get("type");
                if (type == null) {
                    blockIdx++;
                    continue;
                }

                if ("text".equals(type)) {
                    String blockText = (String) block.getOrDefault("text", "");
                    if (blockText == null || blockText.trim().isEmpty()) {
                        blockIdx++;
                        continue;
                    }
                    String sanitized = SanitizationUtil.sanitizeForTelegram(blockText);

                    List<?> blockButtons = (List<?>) block.get("buttons");
                    if (blockIdx == lastSendableIdx && menuButtons != null && !menuButtons.isEmpty()) {
                        blockButtons = menuButtons;
                    }
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
                    if (blockImageUrl == null || blockImageUrl.trim().isEmpty()) {
                        blockIdx++;
                        continue;
                    }

                    List<?> blockButtons = (List<?>) block.get("buttons");
                    if (blockIdx == lastSendableIdx && menuButtons != null && !menuButtons.isEmpty()) {
                        blockButtons = menuButtons;
                    }
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
                    if (blockText == null || blockText.trim().isEmpty()) {
                        blockIdx++;
                        continue;
                    }
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
                } else if ("file".equals(type)) {
                    String blockFileUrl = (String) block.get("fileUrl");
                    if (blockFileUrl == null || blockFileUrl.trim().isEmpty()) {
                        blockIdx++;
                        continue;
                    }

                    List<?> blockButtons = (List<?>) block.get("buttons");
                    if (blockIdx == lastSendableIdx && menuButtons != null && !menuButtons.isEmpty()) {
                        blockButtons = menuButtons;
                    }
                    InlineKeyboardMarkup markup = buildMarkup(blockButtons);
                    if (markup != null) hasButtons = true;

                    boolean isHttp = blockFileUrl.startsWith("http://") || blockFileUrl.startsWith("https://");
                    if (isHttp) {
                        String fileName = (String) block.get("fileName");
                        if (fileName == null || fileName.trim().isEmpty()) {
                            fileName = extractFileName(blockFileUrl);
                        }
                        try (java.io.InputStream stream = openUrlStream(blockFileUrl)) {
                            SendDocument sendDocument = SendDocument.builder()
                                    .chatId(chatId)
                                    .document(new InputFile(stream, fileName))
                                    .replyMarkup(markup)
                                    .build();
                            client.execute(sendDocument);
                        } catch (Exception e) {
                            log.error("Failed to send file stream in node {}: {}", node.id(), e.getMessage());
                        }
                    } else {
                        try {
                            SendDocument sendDocument = SendDocument.builder()
                                    .chatId(chatId)
                                    .document(new InputFile(blockFileUrl))
                                    .replyMarkup(markup)
                                    .build();
                            client.execute(sendDocument);
                        } catch (TelegramApiException e) {
                            log.error("Failed to send file block in node {}: {}", node.id(), e.getMessage());
                        }
                    }
                } else if ("audio".equals(type)) {
                    String blockAudioUrl = (String) block.get("audioUrl");
                    if (blockAudioUrl == null || blockAudioUrl.trim().isEmpty()) {
                        blockIdx++;
                        continue;
                    }

                    List<?> blockButtons = (List<?>) block.get("buttons");
                    if (blockIdx == lastSendableIdx && menuButtons != null && !menuButtons.isEmpty()) {
                        blockButtons = menuButtons;
                    }
                    InlineKeyboardMarkup markup = buildMarkup(blockButtons);
                    if (markup != null) hasButtons = true;

                    boolean isHttp = blockAudioUrl.startsWith("http://") || blockAudioUrl.startsWith("https://");
                    if (isHttp) {
                        String fileName = (String) block.get("fileName");
                        if (fileName == null || fileName.trim().isEmpty()) {
                            fileName = extractFileName(blockAudioUrl);
                            if (!fileName.contains(".")) {
                                fileName += ".mp3";
                            }
                        }
                        try (java.io.InputStream stream = openUrlStream(blockAudioUrl)) {
                            SendAudio sendAudio = SendAudio.builder()
                                    .chatId(chatId)
                                    .audio(new InputFile(stream, fileName))
                                    .replyMarkup(markup)
                                    .build();
                            client.execute(sendAudio);
                        } catch (Exception e) {
                            log.error("Failed to send audio stream in node {}: {}", node.id(), e.getMessage());
                        }
                    } else {
                        try {
                            SendAudio sendAudio = SendAudio.builder()
                                    .chatId(chatId)
                                    .audio(new InputFile(blockAudioUrl))
                                    .replyMarkup(markup)
                                    .build();
                            client.execute(sendAudio);
                        } catch (TelegramApiException e) {
                            log.error("Failed to send audio block in node {}: {}", node.id(), e.getMessage());
                        }
                    }
                } else if ("video".equals(type)) {
                    String blockVideoUrl = (String) block.get("videoUrl");
                    if (blockVideoUrl == null || blockVideoUrl.trim().isEmpty()) {
                        blockIdx++;
                        continue;
                    }

                    List<?> blockButtons = (List<?>) block.get("buttons");
                    if (blockIdx == lastSendableIdx && menuButtons != null && !menuButtons.isEmpty()) {
                        blockButtons = menuButtons;
                    }
                    InlineKeyboardMarkup markup = buildMarkup(blockButtons);
                    if (markup != null) hasButtons = true;

                    boolean isHttp = blockVideoUrl.startsWith("http://") || blockVideoUrl.startsWith("https://");
                    if (isHttp) {
                        String fileName = (String) block.get("fileName");
                        if (fileName == null || fileName.trim().isEmpty()) {
                            fileName = extractFileName(blockVideoUrl);
                            if (!fileName.contains(".")) {
                                fileName += ".mp4";
                            }
                        }
                        try (java.io.InputStream stream = openUrlStream(blockVideoUrl)) {
                            SendVideo sendVideo = SendVideo.builder()
                                    .chatId(chatId)
                                    .video(new InputFile(stream, fileName))
                                    .replyMarkup(markup)
                                    .build();
                            client.execute(sendVideo);
                        } catch (Exception e) {
                            log.error("Failed to send video stream in node {}: {}", node.id(), e.getMessage());
                        }
                    } else {
                        try {
                            SendVideo sendVideo = SendVideo.builder()
                                    .chatId(chatId)
                                    .video(new InputFile(blockVideoUrl))
                                    .replyMarkup(markup)
                                    .build();
                            client.execute(sendVideo);
                        } catch (TelegramApiException e) {
                            log.error("Failed to send video block in node {}: {}", node.id(), e.getMessage());
                        }
                    }
                }
                blockIdx++;
            }

            if (lastSendableIdx == -1 && menuButtons != null && !menuButtons.isEmpty()) {
                String sanitized = SanitizationUtil.sanitizeForTelegram("...");
                InlineKeyboardMarkup markup = buildMarkup(menuButtons);
                if (markup != null) hasButtons = true;
                try {
                    SendMessage message = SendMessage.builder()
                            .chatId(chatId)
                            .text(sanitized)
                            .replyMarkup(markup)
                            .build();
                    client.execute(message);
                } catch (TelegramApiException e) {
                    log.error("Failed to send fallback block for telegram_menu: {}", e.getMessage());
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
        InlineKeyboardRow currentRow = null;
        String lastRowStr = null;

        for (Object btnObj : buttonsList) {
            if (btnObj instanceof Map) {
                Map<String, Object> btn = (Map<String, Object>) btnObj;
                Object labelObj = btn.get("label");
                String label = labelObj instanceof String ? (String) labelObj : "Button";
                Object valueObj = btn.get("value");
                String value = valueObj instanceof String ? (String) valueObj : label;
                Object rowObj = btn.get("row");
                String rowStr = rowObj != null ? rowObj.toString() : null;

                InlineKeyboardButton button = InlineKeyboardButton.builder()
                        .text(label)
                        .callbackData(value)
                        .build();

                if (rowStr != null && !rowStr.trim().isEmpty()) {
                    if (currentRow == null || !rowStr.equals(lastRowStr)) {
                        currentRow = new InlineKeyboardRow();
                        rows.add(currentRow);
                        lastRowStr = rowStr;
                    }
                    currentRow.add(button);
                } else {
                    currentRow = new InlineKeyboardRow(button);
                    rows.add(currentRow);
                    lastRowStr = null;
                }
            }
        }
        return rows.isEmpty() ? null : InlineKeyboardMarkup.builder().keyboard(rows).build();
    }

    private String extractFileName(String url) {
        if (url == null || url.trim().isEmpty()) {
            return "file";
        }
        int lastSlash = url.lastIndexOf('/');
        if (lastSlash != -1 && lastSlash < url.length() - 1) {
            String candidate = url.substring(lastSlash + 1);
            int questionMark = candidate.indexOf('?');
            if (questionMark != -1) {
                candidate = candidate.substring(0, questionMark);
            }
            return candidate;
        }
        return "file";
    }

    private java.io.InputStream openUrlStream(String urlString) throws java.io.IOException {
        java.net.URL url = java.net.URI.create(urlString).toURL();
        java.net.URLConnection connection = url.openConnection();
        connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        return connection.getInputStream();
    }
}
