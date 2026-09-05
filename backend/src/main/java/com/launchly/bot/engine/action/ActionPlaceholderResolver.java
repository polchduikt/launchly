package com.launchly.bot.engine.action;

import com.launchly.bot.entity.BotUser;
import com.launchly.broadcast.entity.Tag;
import com.launchly.broadcast.repository.BotUserTagRepository;
import com.launchly.broadcast.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class ActionPlaceholderResolver {

    private final TagRepository tagRepository;
    private final BotUserTagRepository botUserTagRepository;
    private final ObjectMapper objectMapper;

    public String resolveValue(String text, Map<String, String> variables, BotUser botUser) {
        if (text == null) {
            return "";
        }
        String trimmed = text.trim();

        if (trimmed.contains("+")) {
            String[] parts = trimmed.split("\\+");
            List<String> resolvedParts = new ArrayList<>();
            for (String part : parts) {
                resolvedParts.add(resolveSingleValue(part.trim(), variables, botUser));
            }
            return String.join("_", resolvedParts);
        }

        return resolveSingleValue(trimmed, variables, botUser);
    }

    @SuppressWarnings("unchecked")
    public String resolveSingleValue(String text, Map<String, String> variables, BotUser botUser) {
        if (text == null) {
            return "";
        }
        String trimmed = text.trim();

        if (trimmed.equalsIgnoreCase("First Name") || trimmed.equalsIgnoreCase("first_name")) {
            return botUser.getFirstName() != null ? botUser.getFirstName() : "";
        }
        if (trimmed.equalsIgnoreCase("Last Name") || trimmed.equalsIgnoreCase("last_name")) {
            return botUser.getLastName() != null ? botUser.getLastName() : "";
        }
        if (trimmed.equalsIgnoreCase("Telegram Username") || trimmed.equalsIgnoreCase("telegram_username") || trimmed.equalsIgnoreCase("username")) {
            return botUser.getUsername() != null ? botUser.getUsername() : "";
        }
        if (trimmed.equalsIgnoreCase("Phone")) {
            return variables != null ? variables.getOrDefault("phone", "") : "";
        }
        if (trimmed.equalsIgnoreCase("Email")) {
            return variables != null ? variables.getOrDefault("email", "") : "";
        }
        if (trimmed.equalsIgnoreCase("Contact Id") || trimmed.equalsIgnoreCase("contact_id")) {
            return botUser.getId() != null ? String.valueOf(botUser.getId()) : "";
        }
        if (trimmed.equalsIgnoreCase("Subscribed")) {
            return variables != null ? variables.getOrDefault("telegram_opt_in", "false") : "false";
        }
        if (trimmed.equalsIgnoreCase("Last Reply Type") || trimmed.equalsIgnoreCase("last_reply_type")) {
            return variables != null ? variables.getOrDefault("last_reply_type", "text") : "text";
        }
        if (trimmed.equalsIgnoreCase("Telegram User ID") || trimmed.equalsIgnoreCase("telegram_user_id")) {
            return botUser.getTelegramId() != null ? String.valueOf(botUser.getTelegramId()) : "";
        }
        if (trimmed.equalsIgnoreCase("Opted-in for Telegram") || trimmed.equalsIgnoreCase("telegram_opt_in")) {
            return variables != null ? variables.getOrDefault("telegram_opt_in", "false") : "false";
        }

        try {
            if (botUser.getMetadata() != null && !botUser.getMetadata().trim().isEmpty()) {
                Map<String, Object> metaMap = objectMapper.readValue(botUser.getMetadata(), Map.class);
                Map<String, Object> customFields = (Map<String, Object>) metaMap.get("customFields");
                if (customFields != null) {
                    for (Map.Entry<String, Object> entry : customFields.entrySet()) {
                        if (entry.getKey().equalsIgnoreCase(trimmed)) {
                            return entry.getValue() != null ? String.valueOf(entry.getValue()) : "";
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error reading custom fields: {}", e.getMessage());
        }

        try {
            List<Tag> allTags = tagRepository.findByBotId(botUser.getBot().getId());
            for (Tag t : allTags) {
                if (t.getName().equalsIgnoreCase(trimmed)) {
                    boolean hasTag = botUserTagRepository.existsByBotUserIdAndTagId(botUser.getId(), t.getId());
                    return String.valueOf(hasTag);
                }
            }
        } catch (Exception e) {
            log.error("Error reading tags: {}", e.getMessage());
        }

        return resolvePlaceholders(text, variables, botUser);
    }

    public String replacePlaceholder(String text, String placeholderName, String value) {
        if (text == null || placeholderName == null) {
            return text;
        }
        String resolvedVal = value != null ? value : "";
        try {
            return text.replaceAll("(?i)" + Pattern.quote("{{" + placeholderName + "}}"),
                    Matcher.quoteReplacement(resolvedVal));
        } catch (Exception e) {
            log.debug("Fallback to string replace for placeholder {}: {}", placeholderName, e.getMessage());
            return text.replace("{{" + placeholderName + "}}", resolvedVal)
                    .replace("{{" + placeholderName.toLowerCase() + "}}", resolvedVal);
        }
    }

    @SuppressWarnings("unchecked")
    public String resolvePlaceholders(String text, Map<String, String> variables, BotUser botUser) {
        if (text == null) {
            return "";
        }
        String result = text;

        result = replacePlaceholder(result, "First Name", botUser.getFirstName());
        result = replacePlaceholder(result, "first_name", botUser.getFirstName());

        result = replacePlaceholder(result, "Last Name", botUser.getLastName());
        result = replacePlaceholder(result, "last_name", botUser.getLastName());

        result = replacePlaceholder(result, "Telegram Username", botUser.getUsername());
        result = replacePlaceholder(result, "telegram_username", botUser.getUsername());
        result = replacePlaceholder(result, "username", botUser.getUsername());

        result = replacePlaceholder(result, "Telegram User ID", botUser.getTelegramId() != null ? String.valueOf(botUser.getTelegramId()) : null);
        result = replacePlaceholder(result, "telegram_user_id", botUser.getTelegramId() != null ? String.valueOf(botUser.getTelegramId()) : null);

        result = replacePlaceholder(result, "Contact ID", botUser.getId() != null ? String.valueOf(botUser.getId()) : null);
        result = replacePlaceholder(result, "Contact Id", botUser.getId() != null ? String.valueOf(botUser.getId()) : null);
        result = replacePlaceholder(result, "contact_id", botUser.getId() != null ? String.valueOf(botUser.getId()) : null);

        if (variables != null) {
            result = replacePlaceholder(result, "Phone", variables.get("phone"));
            result = replacePlaceholder(result, "phone", variables.get("phone"));

            result = replacePlaceholder(result, "Email", variables.get("email"));
            result = replacePlaceholder(result, "email", variables.get("email"));

            result = replacePlaceholder(result, "Subscribed", variables.get("telegram_opt_in"));
            result = replacePlaceholder(result, "telegram_opt_in", variables.get("telegram_opt_in"));
            result = replacePlaceholder(result, "Opted-in for Telegram", variables.get("telegram_opt_in"));

            result = replacePlaceholder(result, "Last Reply Type", variables.get("last_reply_type"));
            result = replacePlaceholder(result, "last_reply_type", variables.get("last_reply_type"));
        }

        try {
            if (botUser.getMetadata() != null && !botUser.getMetadata().trim().isEmpty()) {
                Map<String, Object> metaMap = objectMapper.readValue(botUser.getMetadata(), Map.class);
                Map<String, Object> customFields = (Map<String, Object>) metaMap.get("customFields");
                if (customFields != null) {
                    for (Map.Entry<String, Object> entry : customFields.entrySet()) {
                        String valStr = entry.getValue() != null ? String.valueOf(entry.getValue()) : "";
                        result = replacePlaceholder(result, entry.getKey(), valStr);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error replacing custom field placeholders for user {}: {}", botUser.getId(), e.getMessage());
        }

        try {
            List<Tag> allTags = tagRepository.findByBotId(botUser.getBot().getId());
            for (Tag t : allTags) {
                boolean hasTag = botUserTagRepository.existsByBotUserIdAndTagId(botUser.getId(), t.getId());
                String val = String.valueOf(hasTag);
                result = replacePlaceholder(result, "tag:" + t.getName(), val);
                result = replacePlaceholder(result, "tag." + t.getName(), val);
                result = replacePlaceholder(result, t.getName(), val);
            }
        } catch (Exception e) {
            log.error("Error replacing tag placeholders for user {}: {}", botUser.getId(), e.getMessage());
        }

        return result;
    }
}
