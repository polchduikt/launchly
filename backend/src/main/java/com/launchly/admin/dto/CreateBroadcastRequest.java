package com.launchly.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Schema(description = "Request payload to create a platform-wide administrative broadcast")
@Data
public class CreateBroadcastRequest {
    @Schema(description = "Broadcast title", example = "Scheduled Maintenance Notice", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Title is required")
    private String title;

    @Schema(description = "Message body content", example = "We will perform scheduled server upgrades tonight at 03:00 UTC.", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Content is required")
    private String content;

    @Schema(description = "Target audience filter", example = "ALL_USERS")
    private String targetAudience = "ALL_USERS";
}

