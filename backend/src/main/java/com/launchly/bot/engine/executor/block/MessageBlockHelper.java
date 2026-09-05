package com.launchly.bot.engine.executor.block;

import com.launchly.bot.entity.BotUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.InlineKeyboardMarkup;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.InlineKeyboardButton;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.InlineKeyboardRow;
import tools.jackson.databind.ObjectMapper;

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

@Slf4j
@Component
@RequiredArgsConstructor
public class MessageBlockHelper {

    private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("\\{\\{([^}]+)\\}\\}");
    private static final Pattern MARKDOWN_LINK_PATTERN = Pattern.compile("\\[([^\\]]+)\\]\\(([^\\s)]+)\\)");

    private final ObjectMapper objectMapper;

    public InlineKeyboardMarkup buildMarkup(List<?> buttonsList) {
        if (buttonsList == null || buttonsList.isEmpty()) {
            return null;
        }
        List<InlineKeyboardRow> rows = new ArrayList<>();
        InlineKeyboardRow currentRow = null;
        String lastRowStr = null;

        for (Object btnObj : buttonsList) {
            if (btnObj instanceof Map<?, ?> btn) {
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

    public String extractFileName(String url) {
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

    public InputStream openUrlStream(String urlString) throws IOException {
        URL url = URI.create(urlString).toURL();
        URLConnection connection = url.openConnection();
        connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        return connection.getInputStream();
    }

    public String resolvePlaceholders(String text, Map<String, String> variables, BotUser botUser) {
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

    public String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;");
    }

    public String convertMarkdownLinksToHtml(String text) {
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
