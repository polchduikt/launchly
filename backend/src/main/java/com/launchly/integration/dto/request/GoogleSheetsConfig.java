package com.launchly.integration.dto.request;

public record GoogleSheetsConfig(
    String spreadsheetId,
    String sheetName,
    String dataType
) {}
