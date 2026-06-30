package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.service.BotDialogStateService;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.broadcast.entity.BotUserTag;
import com.launchly.broadcast.entity.Tag;
import com.launchly.broadcast.repository.BotUserTagRepository;
import com.launchly.broadcast.repository.TagRepository;
import com.launchly.integration.entity.Integration;
import com.launchly.integration.entity.IntegrationType;
import com.launchly.integration.repository.IntegrationRepository;
import com.launchly.integration.service.GoogleSheetsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import tools.jackson.databind.ObjectMapper;

@Slf4j
@Component
@RequiredArgsConstructor
public class ActionNodeExecutor implements NodeExecutor {

    private final BotDialogStateService stateService;
    private final BotUserRepository botUserRepository;
    private final TagRepository tagRepository;
    private final BotUserTagRepository botUserTagRepository;
    private final IntegrationRepository integrationRepository;
    private final GoogleSheetsService googleSheetsService;

    @Override
    public NodeType getType() {
        return NodeType.ACTION;
    }

    @Override
    @SuppressWarnings("unchecked")
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                          Update update, TelegramClient client) {
        Long botId = botUser.getBot().getId();
        Long telegramUserId = botUser.getTelegramId();
        Map<String, Object> data = node.data();

        log.info("Executing Action Node {} for bot user {}", node.id(), telegramUserId);

        if (data != null && data.get("actions") instanceof List) {
            List<Map<String, Object>> actions = (List<Map<String, Object>>) data.get("actions");
            Map<String, String> sessionData = stateService.getSessionData(botId, telegramUserId);

            for (Map<String, Object> action : actions) {
                String type = (String) action.get("type");
                if (type == null) continue;

                try {
                    switch (type) {
                        case "ADD_TAG": {
                            String tagName = (String) action.get("tagName");
                            Object tagIdObj = action.get("tagId");
                            if (tagIdObj != null && !String.valueOf(tagIdObj).isEmpty()) {
                                Long tagId = Long.parseLong(String.valueOf(tagIdObj));
                                tagRepository.findById(tagId).ifPresent(tag -> {
                                    if (!botUserTagRepository.existsByBotUserIdAndTagId(botUser.getId(), tag.getId())) {
                                        botUserTagRepository.save(BotUserTag.builder().botUser(botUser).tag(tag).build());
                                        log.info("Added tag ID {} to user {}", tag.getId(), telegramUserId);
                                    }
                                });
                            } else if (tagName != null && !tagName.trim().isEmpty()) {
                                Tag tag = tagRepository.findByBotIdAndName(botId, tagName.trim())
                                        .orElseGet(() -> tagRepository.save(Tag.builder().name(tagName.trim()).bot(botUser.getBot()).build()));
                                if (!botUserTagRepository.existsByBotUserIdAndTagId(botUser.getId(), tag.getId())) {
                                    botUserTagRepository.save(BotUserTag.builder().botUser(botUser).tag(tag).build());
                                    log.info("Created and added tag '{}' to user {}", tagName, telegramUserId);
                                }
                            }
                            break;
                        }

                        case "REMOVE_TAG": {
                            String tagName = (String) action.get("tagName");
                            Object tagIdObj = action.get("tagId");
                            if (tagIdObj != null && !String.valueOf(tagIdObj).isEmpty()) {
                                Long tagId = Long.parseLong(String.valueOf(tagIdObj));
                                botUserTagRepository.deleteByBotUserIdAndTagId(botUser.getId(), tagId);
                                log.info("Removed tag ID {} from user {}", tagId, telegramUserId);
                            } else if (tagName != null && !tagName.trim().isEmpty()) {
                                tagRepository.findByBotIdAndName(botId, tagName.trim()).ifPresent(tag -> {
                                    botUserTagRepository.deleteByBotUserIdAndTagId(botUser.getId(), tag.getId());
                                    log.info("Removed tag '{}' from user {}", tagName, telegramUserId);
                                });
                            }
                            break;
                        }

                        case "SET_USER_FIELD": {
                            String fieldName = (String) action.get("fieldName");
                            String fieldValue = (String) action.get("fieldValue");
                            if (fieldName != null && !fieldName.trim().isEmpty()) {
                                String resolvedValue = resolveValue(fieldValue, sessionData, botUser);
                                stateService.setSessionData(botId, telegramUserId, fieldName.trim(), resolvedValue);
                                updateContactCustomField(botUser, fieldName.trim(), resolvedValue);
                                log.info("Set field '{}' = '{}' for user {}", fieldName, resolvedValue, telegramUserId);
                            }
                            break;
                        }

                        case "CLEAR_USER_FIELD": {
                            String fieldName = (String) action.get("fieldName");
                            if (fieldName != null && !fieldName.trim().isEmpty()) {
                                stateService.setSessionData(botId, telegramUserId, fieldName.trim(), "");
                                updateContactCustomField(botUser, fieldName.trim(), null);
                                log.info("Cleared field '{}' for user {}", fieldName, telegramUserId);
                            }
                            break;
                        }

                        case "TELEGRAM_SUBSCRIBE": {
                            stateService.setSessionData(botId, telegramUserId, "telegram_opt_in", "true");
                            updateContactMetadataField(botUser, "telegram_opt_in", true);
                            log.info("Subscribed user {} to Telegram updates", telegramUserId);
                            break;
                        }

                        case "TELEGRAM_UNSUBSCRIBE": {
                            stateService.setSessionData(botId, telegramUserId, "telegram_opt_in", "false");
                            updateContactMetadataField(botUser, "telegram_opt_in", false);
                            log.info("Unsubscribed user {} from Telegram updates", telegramUserId);
                            break;
                        }

                        case "GS_INSERT_ROW": {
                            Integration integration = integrationRepository.findByBotIdAndType(botId, IntegrationType.GOOGLE_SHEETS).orElse(null);
                            if (integration == null) {
                                log.warn("Skipping Google Sheets insert row: no GOOGLE_SHEETS integration configured for bot {}", botId);
                                break;
                            }
                            String spreadsheetId = (String) action.get("spreadsheetId");
                            String sheetName = (String) action.get("sheetName");
                            List<Map<String, String>> mappings = (List<Map<String, String>>) action.get("columnMappings");

                            if (spreadsheetId != null && !spreadsheetId.isEmpty()) {
                                String activeSpreadsheetId = resolveSpreadsheetId(botId, spreadsheetId);
                                String activeSheetName = sheetName != null && !sheetName.trim().isEmpty() ? sheetName.trim() : "Sheet1";
                                List<String> headers = googleSheetsService.getHeaders(botId, activeSpreadsheetId, activeSheetName);
                                List<Object> values = new ArrayList<>();
                                boolean hasMappings = mappings != null && !mappings.isEmpty();
                                if (headers != null && !headers.isEmpty()) {
                                    for (int headerIndex = 0; headerIndex < headers.size(); headerIndex++) {
                                        String header = headers.get(headerIndex);
                                        String resolvedVal = "";
                                        if (hasMappings) {
                                            for (Map<String, String> m : mappings) {
                                                if (header.equals(m.get("column"))) {
                                                    resolvedVal = resolveValue(m.get("value"), sessionData, botUser);
                                                    break;
                                                }
                                            }
                                        } else if (headerIndex == 0) {
                                            resolvedVal = resolveValue("{{username}}", sessionData, botUser);
                                        }
                                        values.add(resolvedVal);
                                    }
                                } else {
                                    if (hasMappings) {
                                        values = mappings.stream()
                                                .map(m -> resolveValue(m.get("value"), sessionData, botUser))
                                                .collect(Collectors.toList());
                                    } else {
                                        values.add(resolveValue("{{username}}", sessionData, botUser));
                                    }
                                }
                                googleSheetsService.appendRow(integration, activeSpreadsheetId, activeSheetName, values);
                                log.info("Inserted row into Google Sheets spreadsheet={} sheet={} for bot user {}", activeSpreadsheetId, activeSheetName, telegramUserId);
                            }
                            break;
                        }

                        case "GS_GET_ROW": {
                            Integration integration = integrationRepository.findByBotIdAndType(botId, IntegrationType.GOOGLE_SHEETS).orElse(null);
                            if (integration == null) {
                                log.warn("Skipping Google Sheets get row: no GOOGLE_SHEETS integration configured for bot {}", botId);
                                break;
                            }
                            String spreadsheetId = (String) action.get("spreadsheetId");
                            String sheetName = (String) action.get("sheetName");
                            String lookupColumn = (String) action.get("lookupColumn");
                            String lookupValue = (String) action.get("lookupValue");
                            List<Map<String, String>> mappings = (List<Map<String, String>>) action.get("columnMappings");

                            if (spreadsheetId != null && !spreadsheetId.isEmpty() && lookupColumn != null && !lookupColumn.isEmpty()) {
                                String activeSpreadsheetId = resolveSpreadsheetId(botId, spreadsheetId);
                                String activeSheetName = sheetName != null && !sheetName.trim().isEmpty() ? sheetName.trim() : "Sheet1";
                                String resolvedLookupVal = resolveValue(lookupValue, sessionData, botUser).trim();

                                List<List<Object>> sheetValues = googleSheetsService.getSheetValues(botId, activeSpreadsheetId, activeSheetName);
                                if (sheetValues != null && !sheetValues.isEmpty()) {
                                    List<Object> headers = sheetValues.get(0);
                                    int lookupColIdx = -1;
                                    for (int i = 0; i < headers.size(); i++) {
                                        if (lookupColumn.equalsIgnoreCase(String.valueOf(headers.get(i)).trim())) {
                                            lookupColIdx = i;
                                            break;
                                        }
                                    }

                                    if (lookupColIdx != -1) {
                                        for (int rowIndex = 1; rowIndex < sheetValues.size(); rowIndex++) {
                                            List<Object> row = sheetValues.get(rowIndex);
                                            if (row.size() > lookupColIdx) {
                                                String cellVal = String.valueOf(row.get(lookupColIdx)).trim();
                                                if (cellVal.equalsIgnoreCase(resolvedLookupVal)) {
                                                    log.info("Found matching row at index {} in Google Sheets for bot user {}", rowIndex, telegramUserId);
                                                    if (mappings != null) {
                                                        for (Map<String, String> m : mappings) {
                                                            String targetGoogleCol = m.get("column");
                                                            String targetLaunchlyField = m.get("value");
                                                            if (targetGoogleCol != null && targetLaunchlyField != null) {
                                                                int targetColIdx = -1;
                                                                for (int hIdx = 0; hIdx < headers.size(); hIdx++) {
                                                                    if (targetGoogleCol.equalsIgnoreCase(String.valueOf(headers.get(hIdx)).trim())) {
                                                                        targetColIdx = hIdx;
                                                                        break;
                                                                    }
                                                                }
                                                                if (targetColIdx != -1 && row.size() > targetColIdx) {
                                                                    String targetValue = String.valueOf(row.get(targetColIdx)).trim();
                                                                    setContactField(botUser, botId, telegramUserId, targetLaunchlyField, targetValue, sessionData);
                                                                }
                                                            }
                                                        }
                                                    }
                                                    break;
                                                }
                                            }
                                        }
                                    } else {
                                        log.warn("Lookup column '{}' not found in spreadsheet {} headers", lookupColumn, activeSpreadsheetId);
                                    }
                                }
                            }
                            break;
                        }

                        case "GS_UPDATE_ROW": {
                            Integration integration = integrationRepository.findByBotIdAndType(botId, IntegrationType.GOOGLE_SHEETS).orElse(null);
                            if (integration == null) {
                                log.warn("Skipping Google Sheets update row: no GOOGLE_SHEETS integration configured for bot {}", botId);
                                break;
                            }
                            String spreadsheetId = (String) action.get("spreadsheetId");
                            String sheetName = (String) action.get("sheetName");
                            String lookupColumn = (String) action.get("lookupColumn");
                            String lookupValue = (String) action.get("lookupValue");
                            List<Map<String, String>> mappings = (List<Map<String, String>>) action.get("columnMappings");

                            if (spreadsheetId != null && !spreadsheetId.isEmpty() && lookupColumn != null && !lookupColumn.isEmpty()) {
                                String activeSpreadsheetId = resolveSpreadsheetId(botId, spreadsheetId);
                                String activeSheetName = sheetName != null && !sheetName.trim().isEmpty() ? sheetName.trim() : "Sheet1";
                                String resolvedLookupVal = resolveValue(lookupValue, sessionData, botUser).trim();

                                List<List<Object>> sheetValues = googleSheetsService.getSheetValues(botId, activeSpreadsheetId, activeSheetName);
                                if (sheetValues != null && !sheetValues.isEmpty()) {
                                    List<Object> headers = sheetValues.get(0);
                                    int lookupColIdx = -1;
                                    for (int i = 0; i < headers.size(); i++) {
                                        if (lookupColumn.equalsIgnoreCase(String.valueOf(headers.get(i)).trim())) {
                                            lookupColIdx = i;
                                            break;
                                        }
                                    }

                                    if (lookupColIdx != -1) {
                                        for (int rowIndex = 1; rowIndex < sheetValues.size(); rowIndex++) {
                                            List<Object> row = sheetValues.get(rowIndex);
                                            if (row.size() > lookupColIdx) {
                                                String cellVal = String.valueOf(row.get(lookupColIdx)).trim();
                                                if (cellVal.equalsIgnoreCase(resolvedLookupVal)) {
                                                    log.info("Updating matching row at index {} in Google Sheets for bot user {}", rowIndex, telegramUserId);
                                                    if (mappings != null) {
                                                        for (Map<String, String> m : mappings) {
                                                            String targetGoogleCol = m.get("column");
                                                            String targetValueExpr = m.get("value");
                                                            if (targetGoogleCol != null && targetValueExpr != null && !targetValueExpr.trim().isEmpty()) {
                                                                int targetColIdx = -1;
                                                                for (int hIdx = 0; hIdx < headers.size(); hIdx++) {
                                                                    if (targetGoogleCol.equalsIgnoreCase(String.valueOf(headers.get(hIdx)).trim())) {
                                                                        targetColIdx = hIdx;
                                                                        break;
                                                                    }
                                                                }
                                                                if (targetColIdx != -1) {
                                                                    String resolvedVal = resolveValue(targetValueExpr, sessionData, botUser);
                                                                    String colLetter = getColumnLetter(targetColIdx);
                                                                    String cellRef = colLetter + (rowIndex + 1);
                                                                    googleSheetsService.updateCell(botId, activeSpreadsheetId, activeSheetName, cellRef, resolvedVal);
                                                                }
                                                            }
                                                        }
                                                    }
                                                    break;
                                                }
                                            }
                                        }
                                    } else {
                                        log.warn("Lookup column '{}' not found in spreadsheet {} headers", lookupColumn, activeSpreadsheetId);
                                    }
                                }
                            }
                            break;
                        }

                        default:
                            log.warn("Unknown action type: {}", type);
                    }
                } catch (Exception e) {
                    log.error("Error executing action type {} in node {}: {}", type, node.id(), e.getMessage(), e);
                }
            }
        }

        return edges.stream()
                .filter(e -> e.source().equals(node.id()) && (e.sourceHandle() == null || "next".equals(e.sourceHandle())))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);
    }

    private String resolveSpreadsheetId(Long botId, String spreadsheetIdOrName) {
        String value = spreadsheetIdOrName != null ? spreadsheetIdOrName.trim() : "";
        if (value.isEmpty()) {
            return value;
        }

        try {
            List<Map<String, String>> spreadsheets = googleSheetsService.getSpreadsheets(botId);
            for (Map<String, String> spreadsheet : spreadsheets) {
                String id = spreadsheet.get("id");
                String name = spreadsheet.get("name");
                if (value.equals(id) || (name != null && value.equalsIgnoreCase(name.trim()))) {
                    return id;
                }
            }
        } catch (Exception e) {
            log.warn("Failed to resolve spreadsheet '{}' by name for bot {}: {}", value, botId, e.getMessage());
        }

        return value;
    }

    private String resolveValue(String text, Map<String, String> variables, BotUser botUser) {
        if (text == null) return "";
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

    private String resolveSingleValue(String text, Map<String, String> variables, BotUser botUser) {
        if (text == null) return "";
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
            return variables.getOrDefault("phone", "");
        }
        if (trimmed.equalsIgnoreCase("Email")) {
            return variables.getOrDefault("email", "");
        }
        if (trimmed.equalsIgnoreCase("Contact Id") || trimmed.equalsIgnoreCase("contact_id")) {
            return botUser.getId() != null ? String.valueOf(botUser.getId()) : "";
        }
        if (trimmed.equalsIgnoreCase("Subscribed")) {
            return variables.getOrDefault("telegram_opt_in", "false");
        }
        if (trimmed.equalsIgnoreCase("Last Reply Type") || trimmed.equalsIgnoreCase("last_reply_type")) {
            return variables.getOrDefault("last_reply_type", "text");
        }
        if (trimmed.equalsIgnoreCase("Telegram User ID") || trimmed.equalsIgnoreCase("telegram_user_id")) {
            return botUser.getTelegramId() != null ? String.valueOf(botUser.getTelegramId()) : "";
        }
        if (trimmed.equalsIgnoreCase("Opted-in for Telegram") || trimmed.equalsIgnoreCase("telegram_opt_in")) {
            return variables.getOrDefault("telegram_opt_in", "false");
        }

        try {
            if (botUser.getMetadata() != null && !botUser.getMetadata().trim().isEmpty()) {
                ObjectMapper objectMapper = new ObjectMapper();
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

    private String replacePlaceholder(String text, String placeholderName, String value) {
        if (text == null || placeholderName == null) return text;
        String resolvedVal = value != null ? value : "";
        try {
            return text.replaceAll("(?i)" + Pattern.quote("{{" + placeholderName + "}}"),
                                   Matcher.quoteReplacement(resolvedVal));
        } catch (Exception e) {
            return text.replace("{{" + placeholderName + "}}", resolvedVal)
                       .replace("{{" + placeholderName.toLowerCase() + "}}", resolvedVal);
        }
    }

    private String resolvePlaceholders(String text, Map<String, String> variables, BotUser botUser) {
        if (text == null) return "";
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

        result = replacePlaceholder(result, "Phone", variables.get("phone"));
        result = replacePlaceholder(result, "phone", variables.get("phone"));

        result = replacePlaceholder(result, "Email", variables.get("email"));
        result = replacePlaceholder(result, "email", variables.get("email"));

        result = replacePlaceholder(result, "Subscribed", variables.get("telegram_opt_in"));
        result = replacePlaceholder(result, "telegram_opt_in", variables.get("telegram_opt_in"));
        result = replacePlaceholder(result, "Opted-in for Telegram", variables.get("telegram_opt_in"));

        result = replacePlaceholder(result, "Last Reply Type", variables.get("last_reply_type"));
        result = replacePlaceholder(result, "last_reply_type", variables.get("last_reply_type"));

        try {
            if (botUser.getMetadata() != null && !botUser.getMetadata().trim().isEmpty()) {
                ObjectMapper objectMapper = new ObjectMapper();
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

    @SuppressWarnings("unchecked")
    private void updateContactCustomField(BotUser botUser, String fieldName, String fieldValue) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            Map<String, Object> metaMap = new HashMap<>();
            if (botUser.getMetadata() != null && !botUser.getMetadata().trim().isEmpty()) {
                try {
                    metaMap = objectMapper.readValue(botUser.getMetadata(), Map.class);
                } catch (Exception e) {
                    log.error("Failed to parse metadata: {}", e.getMessage());
                }
            }
            Map<String, Object> customFields = (Map<String, Object>) metaMap.get("customFields");
            if (customFields == null) {
                customFields = new HashMap<>();
            }
            if (fieldValue == null) {
                customFields.remove(fieldName);
            } else {
                customFields.put(fieldName, fieldValue);
            }
            metaMap.put("customFields", customFields);
            botUser.setMetadata(objectMapper.writeValueAsString(metaMap));
            botUserRepository.save(botUser);
        } catch (Exception e) {
            log.error("Failed to update contact custom field: {}", e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private void updateContactMetadataField(BotUser botUser, String key, Object value) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            Map<String, Object> metaMap = new HashMap<>();
            if (botUser.getMetadata() != null && !botUser.getMetadata().trim().isEmpty()) {
                try {
                    metaMap = objectMapper.readValue(botUser.getMetadata(), Map.class);
                } catch (Exception e) {
                    log.error("Failed to parse metadata: {}", e.getMessage());
                }
            }
            metaMap.put(key, value);
            botUser.setMetadata(objectMapper.writeValueAsString(metaMap));
            botUserRepository.save(botUser);
        } catch (Exception e) {
            log.error("Failed to update contact metadata field: {}", e.getMessage(), e);
        }
    }

    private void setContactField(BotUser botUser, Long botId, Long telegramUserId, String fieldName, String value, Map<String, String> sessionData) {
        String trimmed = fieldName.trim();
        if (trimmed.equalsIgnoreCase("first_name") || trimmed.equalsIgnoreCase("First Name")) {
            botUser.setFirstName(value);
            botUserRepository.save(botUser);
        } else if (trimmed.equalsIgnoreCase("last_name") || trimmed.equalsIgnoreCase("Last Name")) {
            botUser.setLastName(value);
            botUserRepository.save(botUser);
        } else if (trimmed.equalsIgnoreCase("username") || trimmed.equalsIgnoreCase("telegram_username") || trimmed.equalsIgnoreCase("Telegram Username")) {
            botUser.setUsername(value);
            botUserRepository.save(botUser);
        } else if (trimmed.equalsIgnoreCase("phone") || trimmed.equalsIgnoreCase("Phone")) {
            stateService.setSessionData(botId, telegramUserId, "phone", value);
            updateContactMetadataField(botUser, "phone", value);
        } else if (trimmed.equalsIgnoreCase("email") || trimmed.equalsIgnoreCase("Email")) {
            stateService.setSessionData(botId, telegramUserId, "email", value);
            updateContactMetadataField(botUser, "email", value);
        } else {
            stateService.setSessionData(botId, telegramUserId, trimmed, value);
            updateContactCustomField(botUser, trimmed, value);
        }
    }

    private String getColumnLetter(int colIndex) {
        StringBuilder sb = new StringBuilder();
        int temp = colIndex;
        while (temp >= 0) {
            sb.insert(0, (char) ('A' + (temp % 26)));
            temp = (temp / 26) - 1;
        }
        return sb.toString();
    }
}
