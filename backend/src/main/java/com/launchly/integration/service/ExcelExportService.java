package com.launchly.integration.service;

import com.launchly.integration.dto.ExportDataType;
import com.launchly.integration.dto.response.ExcelExportResult;

public interface ExcelExportService {

    ExcelExportResult export(Long botId, ExportDataType dataType, Long userId);
}
