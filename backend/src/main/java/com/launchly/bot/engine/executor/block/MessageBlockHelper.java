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

    private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("\\{+([^{}]+)\\}+");

    public String resolvePlaceholders(String text, Map<String, String> variables, BotUser botUser) {
        if (text == null) return "";
        String result = text;

        Matcher matcher = PLACEHOLDER_PATTERN.matcher(result);
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            String rawName = matcher.group(1).trim();
            String cleanName = rawName.replaceAll("^\\{+|\\}+$", "").trim();
            String strippedName = cleanName.replaceFirst("^(?i)(custom_fields|customFields|fields|custom_field|field)\\.", "").trim();
            String replacement = "";
            boolean found = false;

            if (cleanName.equalsIgnoreCase("chat_type") || cleanName.equalsIgnoreCase("Chat Type")) {
                replacement = variables != null ? variables.getOrDefault("chat_type", "private") : "private";
                found = true;
            } else if (cleanName.equalsIgnoreCase("chat_id") || cleanName.equalsIgnoreCase("Chat Id") || cleanName.equalsIgnoreCase("Chat ID")) {
                replacement = (botUser != null && botUser.getTelegramId() != null)
                        ? String.valueOf(botUser.getTelegramId())
                        : (variables != null ? variables.getOrDefault("chat_id", "") : "");
                found = true;
            } else if (cleanName.equalsIgnoreCase("chat_title") || cleanName.equalsIgnoreCase("Chat Title")) {
                replacement = variables != null ? variables.getOrDefault("chat_title", "") : "";
                found = true;
            } else if (cleanName.equalsIgnoreCase("first_name") || cleanName.equalsIgnoreCase("First Name")) {
                if (botUser != null && botUser.getFirstName() != null && !botUser.getFirstName().trim().isEmpty()) {
                    replacement = botUser.getFirstName();
                } else if (variables != null && variables.containsKey("first_name")) {
                    replacement = variables.get("first_name");
                } else if (variables != null && variables.containsKey("First Name")) {
                    replacement = variables.get("First Name");
                } else {
                    replacement = "";
                }
                found = true;
            } else if (cleanName.equalsIgnoreCase("last_name") || cleanName.equalsIgnoreCase("Last Name")) {
                if (botUser != null && botUser.getLastName() != null && !botUser.getLastName().trim().isEmpty()) {
                    replacement = botUser.getLastName();
                } else if (variables != null && variables.containsKey("last_name")) {
                    replacement = variables.get("last_name");
                } else if (variables != null && variables.containsKey("Last Name")) {
                    replacement = variables.get("Last Name");
                } else {
                    replacement = "";
                }
                found = true;
            } else if (cleanName.equalsIgnoreCase("username") || cleanName.equalsIgnoreCase("telegram_username") || cleanName.equalsIgnoreCase("Telegram Username")) {
                String username = botUser != null ? botUser.getUsername() : null;
                if (username != null && !username.trim().isEmpty()) {
                    replacement = username.startsWith("@") ? username : "@" + username;
                } else if (variables != null && variables.containsKey("username") && variables.get("username") != null && !variables.get("username").trim().isEmpty()) {
                    String u = variables.get("username").trim();
                    replacement = u.startsWith("@") ? u : "@" + u;
                } else if (variables != null && variables.containsKey("telegram_username") && variables.get("telegram_username") != null && !variables.get("telegram_username").trim().isEmpty()) {
                    String u = variables.get("telegram_username").trim();
                    replacement = u.startsWith("@") ? u : "@" + u;
                } else {
                    replacement = "";
                }
                found = true;
            } else if (cleanName.equalsIgnoreCase("telegram_user_id") || cleanName.equalsIgnoreCase("Telegram User ID")) {
                replacement = (botUser != null && botUser.getTelegramId() != null) ? String.valueOf(botUser.getTelegramId()) : "";
                found = true;
            } else if (cleanName.equalsIgnoreCase("contact_id") || cleanName.equalsIgnoreCase("Contact Id")) {
                replacement = (botUser != null && botUser.getId() != null) ? String.valueOf(botUser.getId()) : "";
                found = true;
            } else if (cleanName.equalsIgnoreCase("phone") || cleanName.equalsIgnoreCase("Phone")) {
                replacement = variables != null ? variables.getOrDefault("phone", "") : "";
                found = true;
            } else if (cleanName.equalsIgnoreCase("email") || cleanName.equalsIgnoreCase("Email")) {
                replacement = variables != null ? variables.getOrDefault("email", "") : "";
                found = true;
            } else if (cleanName.equalsIgnoreCase("subscribed") || cleanName.equalsIgnoreCase("Subscribed")) {
                replacement = variables != null ? variables.getOrDefault("telegram_opt_in", "false") : "false";
                found = true;
            } else if (cleanName.equalsIgnoreCase("last_reply_type") || cleanName.equalsIgnoreCase("Last Reply Type")) {
                replacement = variables != null ? variables.getOrDefault("last_reply_type", "text") : "text";
                found = true;
            } else if (cleanName.equalsIgnoreCase("photo_url") || cleanName.equalsIgnoreCase("Photo Url")
                    || cleanName.equalsIgnoreCase("photo") || cleanName.equalsIgnoreCase("Photo")
                    || cleanName.equalsIgnoreCase("avatar") || cleanName.equalsIgnoreCase("Avatar")) {
                if (botUser != null && botUser.getPhotoUrl() != null && !botUser.getPhotoUrl().trim().isEmpty()) {
                    replacement = botUser.getPhotoUrl();
                    found = true;
                } else if (variables != null && variables.containsKey("photo_url")) {
                    replacement = variables.get("photo_url");
                    found = true;
                } else if (variables != null && variables.containsKey("found_photo_url")) {
                    replacement = variables.get("found_photo_url");
                    found = true;
                }
            }

            if (!found && botUser != null && botUser.getMetadata() != null && !botUser.getMetadata().trim().isEmpty()) {
                try {
                    Map<String, Object> metaMap = this.objectMapper.readValue(botUser.getMetadata(), Map.class);
                    Map<String, Object> customFields = (Map<String, Object>) metaMap.get("customFields");
                    if (customFields != null) {
                        for (Map.Entry<String, Object> entry : customFields.entrySet()) {
                            if (entry.getKey().equalsIgnoreCase(cleanName) || entry.getKey().equalsIgnoreCase(strippedName)) {
                                replacement = entry.getValue() != null ? String.valueOf(entry.getValue()) : "";
                                found = true;
                                break;
                            }
                        }
                    }

                    if (!found) {
                        Map<String, Object> chatCustomFields = (Map<String, Object>) metaMap.get("chatCustomFields");
                        if (chatCustomFields != null) {
                            String targetScope = variables != null ? variables.get("chat_id") : null;
                            if (targetScope != null && chatCustomFields.get(targetScope) instanceof Map<?, ?> scopeMap) {
                                for (Map.Entry<?, ?> entry : scopeMap.entrySet()) {
                                    if (String.valueOf(entry.getKey()).equalsIgnoreCase(cleanName) || String.valueOf(entry.getKey()).equalsIgnoreCase(strippedName)) {
                                        replacement = entry.getValue() != null ? String.valueOf(entry.getValue()) : "";
                                        found = true;
                                        break;
                                    }
                                }
                            }
                            if (!found) {
                                for (Object groupVal : chatCustomFields.values()) {
                                    if (groupVal instanceof Map<?, ?> scopeMap) {
                                        for (Map.Entry<?, ?> entry : scopeMap.entrySet()) {
                                            if (String.valueOf(entry.getKey()).equalsIgnoreCase(cleanName) || String.valueOf(entry.getKey()).equalsIgnoreCase(strippedName)) {
                                                replacement = entry.getValue() != null ? String.valueOf(entry.getValue()) : "";
                                                found = true;
                                                break;
                                            }
                                        }
                                        if (found) break;
                                    }
                                }
                            }
                        }
                    }

                    if (!found) {
                        for (Map.Entry<String, Object> entry : metaMap.entrySet()) {
                            if (entry.getKey().equalsIgnoreCase(cleanName) || entry.getKey().equalsIgnoreCase(strippedName)) {
                                replacement = entry.getValue() != null ? String.valueOf(entry.getValue()) : "";
                                found = true;
                                break;
                            }
                        }
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse metadata for placeholder {}: {}", cleanName, e.getMessage());
                }
            }

            if (!found && variables != null) {
                for (Map.Entry<String, String> entry : variables.entrySet()) {
                    if (entry.getKey().equalsIgnoreCase(cleanName) || entry.getKey().equalsIgnoreCase(strippedName)) {
                        replacement = entry.getValue() != null ? entry.getValue() : "";
                        if (cleanName.toLowerCase().contains("username") && replacement != null && !replacement.isEmpty() && !replacement.startsWith("@")) {
                            replacement = "@" + replacement;
                        }
                        found = true;
                        break;
                    }
                }
                if (!found && cleanName.toLowerCase().startsWith("found_user.")) {
                    String subKey = cleanName.substring("found_user.".length());
                    for (Map.Entry<String, String> entry : variables.entrySet()) {
                        if (entry.getKey().equalsIgnoreCase("found_" + subKey) || entry.getKey().equalsIgnoreCase(cleanName)) {
                            replacement = entry.getValue() != null ? entry.getValue() : "";
                            if (subKey.toLowerCase().contains("username") && replacement != null && !replacement.isEmpty() && !replacement.startsWith("@")) {
                                replacement = "@" + replacement;
                            }
                            found = true;
                            break;
                        }
                    }
                }
            }

            if (!found) {
                replacement = "";
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
