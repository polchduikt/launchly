package com.launchly.integration.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ExcelConfig(
    @NotBlank(message = "dataType must be ORDERS or LEADS for Excel export config")
    @Pattern(regexp = "(?i)^(ORDERS|LEADS)$", message = "dataType must be ORDERS or LEADS for Excel export config")
    String dataType
) {}
