package com.launchly.integration.dto.response;

import org.springframework.http.HttpHeaders;

public record ExcelExportResult(
    byte[] data,
    HttpHeaders headers
) {}
