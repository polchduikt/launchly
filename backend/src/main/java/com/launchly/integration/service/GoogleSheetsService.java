package com.launchly.integration.service;

import com.launchly.integration.entity.Integration;
import java.util.List;
import java.util.Map;

public interface GoogleSheetsService {

    String buildAuthorizationUrl(Long botId, Long userId);

    Long authenticate(String stateToken, String code);

    void appendRow(Integration integration, String spreadsheetId, String sheetName, List<Object> values);

    void refreshTokenIfNeeded(Integration integration);

    List<Map<String, String>> getSpreadsheets(Long botId);

    List<String> getWorksheets(Long botId, String spreadsheetId);

    List<String> getHeaders(Long botId, String spreadsheetId, String worksheetName);

    List<List<Object>> getSheetValues(Long botId, String spreadsheetId, String worksheetName);

    void updateCell(Long botId, String spreadsheetId, String worksheetName, String cellReference, Object value);
}

