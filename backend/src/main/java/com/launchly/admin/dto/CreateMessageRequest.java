package com.launchly.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "Request payload to send a support chat message")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMessageRequest {

    @Schema(description = "Message body text", example = "Ваше звернення розглянуто, доступ відновлено.", requiredMode = Schema.RequiredMode.REQUIRED)
    private String text;
}

