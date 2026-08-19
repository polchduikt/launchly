package com.launchly.broadcast.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "Subscriber tag details")
public record TagResponse(
        @Schema(description = "Tag ID", example = "1")
        Long id,

        @Schema(description = "Tag label", example = "VIP_CUSTOMER")
        String name,

        @Schema(description = "Belonging Bot ID", example = "5")
        Long botId,

        @Schema(description = "Creation date")
        LocalDateTime createdAt
) {}

