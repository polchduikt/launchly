package com.launchly.integration.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record GoogleSheetsConfig(
    @NotBlank(message = "spreadsheetId is required for Google Sheets")
    String spreadsheetId,

    @NotBlank(message = "sheetName is required for Google Sheets")
    String sheetName,

    @NotBlank(message = "dataType must be ORDERS or LEADS for Google Sheets")
    @Pattern(regexp = "(?i)^(ORDERS|LEADS)$", message = "dataType must be ORDERS or LEADS for Google Sheets")
    String dataType
) {}
