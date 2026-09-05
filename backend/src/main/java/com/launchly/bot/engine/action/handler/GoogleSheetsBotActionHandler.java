package com.launchly.bot.engine.action.handler;

import com.launchly.bot.engine.action.ActionContactManager;
import com.launchly.bot.engine.action.ActionPlaceholderResolver;
import com.launchly.bot.engine.action.BotActionHandler;
import com.launchly.bot.entity.BotUser;
import com.launchly.integration.entity.Integration;
import com.launchly.integration.entity.IntegrationType;
import com.launchly.integration.repository.IntegrationRepository;
import com.launchly.integration.service.GoogleSheetsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class GoogleSheetsBotActionHandler implements BotActionHandler {

    private final IntegrationRepository integrationRepository;
    private final GoogleSheetsService googleSheetsService;
    private final ActionPlaceholderResolver placeholderResolver;
    private final ActionContactManager contactManager;

    @Override
    public Set<String> getSupportedTypes() {
        return Set.of("GS_INSERT_ROW", "GS_GET_ROW", "GS_UPDATE_ROW");
    }

    @Override
    @SuppressWarnings("unchecked")
    public void execute(String type, Map<String, Object> action, BotUser botUser, Map<String, String> sessionData) {
        Long botId = botUser.getBot().getId();
        Long telegramUserId = botUser.getTelegramId();

        Integration integration = integrationRepository.findByBotIdAndType(botId, IntegrationType.GOOGLE_SHEETS).orElse(null);
        if (integration == null) {
            log.warn("Skipping Google Sheets {}: no GOOGLE_SHEETS integration configured for bot {}", type, botId);
            return;
        }

        String spreadsheetId = (String) action.get("spreadsheetId");
        String sheetName = (String) action.get("sheetName");
        List<Map<String, String>> mappings = (List<Map<String, String>>) action.get("columnMappings");

        if (spreadsheetId == null || spreadsheetId.isEmpty()) {
            return;
        }

        String activeSpreadsheetId = resolveSpreadsheetId(botId, spreadsheetId);
        String activeSheetName = sheetName != null && !sheetName.trim().isEmpty() ? sheetName.trim() : "Sheet1";

        switch (type) {
            case "GS_INSERT_ROW":
                handleInsertRow(integration, botId, telegramUserId, activeSpreadsheetId, activeSheetName, mappings, sessionData, botUser);
                break;
            case "GS_GET_ROW":
                handleGetRow(botId, telegramUserId, activeSpreadsheetId, activeSheetName, action, mappings, sessionData, botUser);
                break;
            case "GS_UPDATE_ROW":
                handleUpdateRow(botId, telegramUserId, activeSpreadsheetId, activeSheetName, action, mappings, sessionData, botUser);
                break;
            default:
                log.warn("Unsupported Google Sheets action: {}", type);
        }
    }

    private void handleInsertRow(Integration integration, Long botId, Long telegramUserId,
                                 String activeSpreadsheetId, String activeSheetName,
                                 List<Map<String, String>> mappings, Map<String, String> sessionData, BotUser botUser) {
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
                            resolvedVal = placeholderResolver.resolveValue(m.get("value"), sessionData, botUser);
                            break;
                        }
                    }
                } else if (headerIndex == 0) {
                    resolvedVal = placeholderResolver.resolveValue("{{username}}", sessionData, botUser);
                }
                values.add(resolvedVal);
            }
        } else {
            if (hasMappings) {
                values = mappings.stream()
                        .map(m -> placeholderResolver.resolveValue(m.get("value"), sessionData, botUser))
                        .collect(Collectors.toList());
            } else {
                values.add(placeholderResolver.resolveValue("{{username}}", sessionData, botUser));
            }
        }
        googleSheetsService.appendRow(integration, activeSpreadsheetId, activeSheetName, values);
        log.info("Inserted row into Google Sheets spreadsheet={} sheet={} for bot user {}", activeSpreadsheetId, activeSheetName, telegramUserId);
    }

    private void handleGetRow(Long botId, Long telegramUserId, String activeSpreadsheetId, String activeSheetName,
                              Map<String, Object> action, List<Map<String, String>> mappings,
                              Map<String, String> sessionData, BotUser botUser) {
        String lookupColumn = (String) action.get("lookupColumn");
        String lookupValue = (String) action.get("lookupValue");
        if (lookupColumn == null || lookupColumn.isEmpty()) {
            return;
        }
        String resolvedLookupVal = placeholderResolver.resolveValue(lookupValue, sessionData, botUser).trim();

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
                                            contactManager.setContactField(botUser, botId, telegramUserId, targetLaunchlyField, targetValue, sessionData);
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

    private void handleUpdateRow(Long botId, Long telegramUserId, String activeSpreadsheetId, String activeSheetName,
                                 Map<String, Object> action, List<Map<String, String>> mappings,
                                 Map<String, String> sessionData, BotUser botUser) {
        String lookupColumn = (String) action.get("lookupColumn");
        String lookupValue = (String) action.get("lookupValue");
        if (lookupColumn == null || lookupColumn.isEmpty()) {
            return;
        }
        String resolvedLookupVal = placeholderResolver.resolveValue(lookupValue, sessionData, botUser).trim();

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
                                            String resolvedVal = placeholderResolver.resolveValue(targetValueExpr, sessionData, botUser);
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
