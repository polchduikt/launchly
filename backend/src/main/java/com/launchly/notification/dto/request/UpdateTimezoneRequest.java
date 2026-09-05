package com.launchly.notification.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Request payload to update user preferred timezone")
public record UpdateTimezoneRequest(
        @Schema(description = "IANA Timezone identifier", example = "Europe/Kyiv", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "validation.notification.timezone.required")
        @Size(max = 100, message = "validation.notification.timezone.size")
        String timezone
) {}
