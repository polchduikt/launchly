package com.launchly.bot.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Request payload to update subscriber profile and tags")
public record BotUserUpdateRequest(
        @Schema(description = "Subscriber first name", example = "Олександр")
        String firstName,

        @Schema(description = "Subscriber last name", example = "Коваленко")
        String lastName,

        @Schema(description = "Custom JSON metadata attributes", example = "{\"source\": \"instagram\"}")
        String metadata,

        @Schema(description = "Updated list of tags", example = "[\"VIP\", \"CUSTOMER\"]")
        List<String> tags
) {}

