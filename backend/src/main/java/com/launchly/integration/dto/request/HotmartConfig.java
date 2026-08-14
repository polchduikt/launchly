package com.launchly.integration.dto.request;

import jakarta.validation.constraints.NotBlank;

public record HotmartConfig(
    @NotBlank(message = "Hottok verification token is required")
    String hottok,

    Boolean syncOrders,

    Boolean syncLeads
) {}
