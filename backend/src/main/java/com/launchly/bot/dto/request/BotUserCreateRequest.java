package com.launchly.bot.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

@Schema(description = "Request payload to manually register a new bot subscriber / contact")
public record BotUserCreateRequest(
    @Schema(description = "Subscriber first name", example = "Олександр", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "First name is required") String firstName,

    @Schema(description = "Subscriber last name", example = "Коваленко")
    String lastName,

    @Schema(description = "Contact phone number", example = "+380501234567")
    String phone,

    @Schema(description = "Contact email", example = "oleksandr@example.com")
    String email,

    @Schema(description = "Gender: MALE, FEMALE, OTHER", example = "MALE")
    String gender,

    @Schema(description = "List of assigned tag names", example = "[\"VIP\", \"LEAD\"]")
    List<String> tags
) {}

