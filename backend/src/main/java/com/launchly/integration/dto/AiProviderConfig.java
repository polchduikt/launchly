package com.launchly.integration.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiProviderConfig {
    @NotBlank(message = "API Key is required")
    private String apiKey;
}
