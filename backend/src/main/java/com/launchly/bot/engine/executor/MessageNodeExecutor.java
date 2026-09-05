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
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import com.launchly.bot.service.BotDialogStateService;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.ObjectMapper;
import org.springframework.data.redis.core.StringRedisTemplate;
import com.launchly.bot.engine.model.DataCollectionState;

@Slf4j
@Component
@RequiredArgsConstructor
public class MessageNodeExecutor implements NodeExecutor {

    private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("\\{\\{([^}]+)\\}\\}");
    private static final Pattern MARKDOWN_LINK_PATTERN = Pattern.compile("\\[([^\\]]+)\\]\\(([^\\s)]+)\\)");

    private final BotDialogStateService stateService;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public NodeType getType() {
        return NodeType.MESSAGE;
    }

    @Override
    @SuppressWarnings("unchecked")
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                          Update update, TelegramClient client) {
        if (botUser == null || botUser.getTelegramId() == null) {
            return null;
        }
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
            Long botId = botUser.getBot() != null ? botUser.getBot().getId() : null;
            Map<String, String> sessionData = botId != null ? stateService.getSessionData(botId, botUser.getTelegramId()) : Map.of();
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
                    String resolvedText = resolvePlaceholders(blockText, sessionData, botUser);
                    String escapedText = escapeHtml(resolvedText);
                    String htmlText = convertMarkdownLinksToHtml(escapedText);

                    List<?> blockButtons = (List<?>) block.get("buttons");
                    if (blockIdx == lastSendableIdx && menuButtons != null && !menuButtons.isEmpty()) {
                        blockButtons = menuButtons;
                    }
                    InlineKeyboardMarkup markup = buildMarkup(blockButtons);
                    if (markup != null) hasButtons = true;

                    try {
                        SendMessage message = SendMessage.builder()
                                .chatId(chatId)
                                .text(htmlText)
                                .parseMode("HTML")
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
                        } catch (NumberFormatException e) {
                            log.warn("Invalid delaySeconds string '{}' in node {}, fallback to 3s", delayObj, node.id());
                        }

                    }

                    try {
                        Thread.sleep(delaySeconds * 1000L);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        log.warn("Delay interrupted in node {}", node.id());
                    }

                } else if ("data_collection".equals(type)) {
                    String blockText = (String) block.getOrDefault("text", "");
                    if (blockText != null && !blockText.trim().isEmpty()) {
                        String resolvedText = resolvePlaceholders(blockText, sessionData, botUser);
                        String escapedText = escapeHtml(resolvedText);
                        String htmlText = convertMarkdownLinksToHtml(escapedText);

                        try {
                            SendMessage message = SendMessage.builder()
                                    .chatId(chatId)
                                    .text(htmlText)
                                    .parseMode("HTML")
                                    .build();
                            client.execute(message);
                        } catch (TelegramApiException e) {
                            log.error("Failed to send data collection question in node {}: {}", node.id(), e.getMessage());
                        }
                    }

                    try {
                        String replyType = (String) block.getOrDefault("replyType", "Text");
                        String variableName = (String) block.getOrDefault("variableName", "");
                        Object expObj = block.get("expirationMinutes");
                        int expirationMinutes = expObj instanceof Number ? ((Number) expObj).intValue() : 30;
                        Object retryObj = block.get("retryCount");
                        int retryCount = retryObj instanceof Number ? ((Number) retryObj).intValue() : 3;

                        DataCollectionState state = DataCollectionState.builder()
                                .nodeId(node.id())
                                .blockId((String) block.get("id"))
                                .replyType(replyType)
                                .saveToField(variableName)
                                .retryCount(retryCount)
                                .expiresAt(System.currentTimeMillis() + (expirationMinutes * 60 * 1000L))
                                .build();

                        String dcKey = "launchly:bot:data_collection:" + botUser.getBot().getId() + ":" + botUser.getTelegramId();
                        redisTemplate.opsForValue().set(dcKey, objectMapper.writeValueAsString(state));
                    } catch (Exception e) {
                        log.error("Failed to save data collection state: {}", e.getMessage(), e);
                    }

                    return null;
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
                        try (InputStream stream = openUrlStream(blockFileUrl)) {
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
                        try (InputStream stream = openUrlStream(blockAudioUrl)) {
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
                        try (InputStream stream = openUrlStream(blockVideoUrl)) {
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
            String text = data != null ? (String) data.get("text") : null;
            String imageUrl = data != null ? (String) data.get("imageUrl") : null;
            List<?> buttonsList = data != null ? (List<?>) data.get("buttons") : null;

            boolean hasText = text != null && !text.trim().isEmpty();
            boolean hasImage = imageUrl != null && !imageUrl.trim().isEmpty();
            InlineKeyboardMarkup markup = buildMarkup(buttonsList);
            if (markup != null) hasButtons = true;

            if (hasImage) {
                String sanitizedText = hasText ? SanitizationUtil.sanitizeForTelegram(text) : "";
                try {
                    SendPhoto sendPhoto = SendPhoto.builder()
                            .chatId(chatId)
                            .photo(new InputFile(imageUrl))
                            .caption(sanitizedText)
                            .replyMarkup(markup)
                            .build();
                    client.execute(sendPhoto);
                } catch (TelegramApiException e) {
                    log.error("Failed to send photo for node {}: {}", node.id(), e.getMessage());
                }
            } else if (hasText || markup != null) {
                String sanitizedText = hasText ? SanitizationUtil.sanitizeForTelegram(text) : "...";
                try {
                    SendMessage message = SendMessage.builder()
                            .chatId(chatId)
                            .text(sanitizedText)
                            .replyMarkup(markup)
                            .build();
                    client.execute(message);
                } catch (TelegramApiException e) {
                    log.error("Failed to send legacy flat message for node {}: {}", node.id(), e.getMessage());
                }
            } else {
                log.debug("Message node {} is empty (no text/image/buttons), skipping sending.", node.id());
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

    private InputStream openUrlStream(String urlString) throws IOException {
        URL url = URI.create(urlString).toURL();
        URLConnection connection = url.openConnection();
        connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        return connection.getInputStream();
    }

    private String resolvePlaceholders(String text, Map<String, String> variables, BotUser botUser) {
        if (text == null) return "";
        String result = text;

        Matcher matcher = PLACEHOLDER_PATTERN.matcher(result);
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            String rawName = matcher.group(1).trim();
            String replacement = "";
            if (rawName.equalsIgnoreCase("first_name") || rawName.equalsIgnoreCase("First Name")) {
                replacement = botUser.getFirstName() != null ? botUser.getFirstName() : "";
            } else if (rawName.equalsIgnoreCase("last_name") || rawName.equalsIgnoreCase("Last Name")) {
                replacement = botUser.getLastName() != null ? botUser.getLastName() : "";
            } else if (rawName.equalsIgnoreCase("username") || rawName.equalsIgnoreCase("telegram_username") || rawName.equalsIgnoreCase("Telegram Username")) {
                String username = botUser.getUsername();
                if (username != null && !username.trim().isEmpty()) {
                    replacement = username.startsWith("@") ? username : "@" + username;
                } else {
                    replacement = "";
                }
            } else if (rawName.equalsIgnoreCase("telegram_user_id") || rawName.equalsIgnoreCase("Telegram User ID")) {
                replacement = botUser.getTelegramId() != null ? String.valueOf(botUser.getTelegramId()) : "";
            } else if (rawName.equalsIgnoreCase("contact_id") || rawName.equalsIgnoreCase("Contact Id")) {
                replacement = botUser.getId() != null ? String.valueOf(botUser.getId()) : "";
            } else if (rawName.equalsIgnoreCase("phone") || rawName.equalsIgnoreCase("Phone")) {
                replacement = variables.getOrDefault("phone", "");
            } else if (rawName.equalsIgnoreCase("email") || rawName.equalsIgnoreCase("Email")) {
                replacement = variables.getOrDefault("email", "");
            } else if (rawName.equalsIgnoreCase("subscribed") || rawName.equalsIgnoreCase("Subscribed")) {
                replacement = variables.getOrDefault("telegram_opt_in", "false");
            } else if (rawName.equalsIgnoreCase("last_reply_type") || rawName.equalsIgnoreCase("Last Reply Type")) {
                replacement = variables.getOrDefault("last_reply_type", "text");
            } else {
                boolean found = false;
                for (Map.Entry<String, String> entry : variables.entrySet()) {
                    if (entry.getKey().equalsIgnoreCase(rawName)) {
                        replacement = entry.getValue() != null ? entry.getValue() : "";
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    try {
                        if (botUser.getMetadata() != null && !botUser.getMetadata().trim().isEmpty()) {
                            Map<String, Object> metaMap = this.objectMapper.readValue(botUser.getMetadata(), Map.class);
                            Map<String, Object> customFields = (Map<String, Object>) metaMap.get("customFields");
                            if (customFields != null) {
                                for (Map.Entry<String, Object> entry : customFields.entrySet()) {
                                    if (entry.getKey().equalsIgnoreCase(rawName)) {
                                        replacement = entry.getValue() != null ? String.valueOf(entry.getValue()) : "";
                                        found = true;
                                        break;
                                    }
                                }
                            }
                        }
                    } catch (Exception e) {
                        log.warn("Failed to parse customFields from botUser metadata: {}", e.getMessage());
                    }

                }
                if (!found) {
                    replacement = matcher.group(0);
                }
            }
            matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;");
    }

    private String convertMarkdownLinksToHtml(String text) {
        if (text == null) return "";
        Matcher matcher = MARKDOWN_LINK_PATTERN.matcher(text);
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            String linkText = matcher.group(1);
            String url = matcher.group(2).trim();
            if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("tg://")) {
                url = "https://" + url;
            }
            String htmlLink = "<a href=\"" + url + "\">" + linkText + "</a>";
            matcher.appendReplacement(sb, Matcher.quoteReplacement(htmlLink));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }
}
