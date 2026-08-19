package com.launchly.ai.dto.request;

import com.launchly.ai.dto.AiMessage;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

@Schema(description = "Request payload to automatically generate chatbot workflow nodes and edges using AI")
public record AiSchemaRequest(
    @Schema(description = "Natural language description of desired bot scenario", example = "Бот для онлайн-запису на послуги барбершопу з кнопками вибору майстра, дати і часу", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Description is required")
    String description,

    @Schema(description = "Previous dialogue context if refining existing flow")
    List<AiMessage> history
) {}

