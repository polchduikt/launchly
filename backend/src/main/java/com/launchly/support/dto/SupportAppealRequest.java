package com.launchly.support.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "Public support appeal / contact form inquiry")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportAppealRequest {
    @Schema(description = "Sender email address", example = "guest@example.com", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank
    private String email;

    @Schema(description = "Sender name", example = "Guest User")
    private String name;

    @Schema(description = "Inquiry message content", example = "I have a question about the Enterprise pricing plan.", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank
    private String message;
}

