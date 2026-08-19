package com.launchly.support.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "Request payload to open a new support ticket")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTicketRequest {
    @Schema(description = "Brief summary of issue", example = "Issue connecting Google Sheets integration", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank
    private String subject;

    @Schema(description = "Detailed issue description / message", example = "When clicking authorize, I get a redirect error on page.", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank
    private String message;
}

