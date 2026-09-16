package com.launchly.crm.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Request payload to create a custom CRM label")
public record CreateLabelRequest(
        @Schema(description = "Label name", example = "VIP Customer", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "validation.label.name.required")
        @Size(max = 100, message = "validation.label.name.size")
        String name
) {}
