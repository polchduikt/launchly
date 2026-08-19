package com.launchly.broadcast.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Request payload to create a new subscriber tag")
public record CreateTagRequest(
        @Schema(description = "Unique tag label", example = "VIP_CUSTOMER", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "Tag name is required")
        @Size(max = 100, message = "Tag name must be at most 100 characters")
        String name
) {}

