package com.launchly.support.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Schema(description = "Public support appeal / contact form inquiry")
@Builder
public record SupportAppealRequest(
        @Schema(description = "Sender email address", example = "guest@example.com", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank
        String email,

        @Schema(description = "Sender name", example = "Guest User")
        String name,

        @Schema(description = "Inquiry message content", example = "I have a question about the Enterprise pricing plan.", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank
        String message
) {
    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }

    public String getMessage() {
        return message;
    }
}
