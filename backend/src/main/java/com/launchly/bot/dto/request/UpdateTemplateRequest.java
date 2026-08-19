package com.launchly.bot.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Request payload to update existing bot template metadata and bundled items")
public record UpdateTemplateRequest(
        @Schema(description = "Template title", example = "E-Commerce Onboarding & Order Flow v2")
        String name,

        @Schema(description = "Template description")
        String description,

        @Schema(description = "Template preview image URL")
        String avatarUrl,

        @Schema(description = "Whether template schema is protected from modification", example = "false")
        boolean isProtected,

        @Schema(description = "External user guide documentation URL")
        String guideUrl,

        @Schema(description = "Video tutorial walkthrough URL")
        String videoUrl,

        @Schema(description = "Updated list of automation flow IDs")
        List<String> selectedFlowIds,

        @Schema(description = "Updated list of broadcast IDs")
        List<Long> selectedBroadcastIds,

        @Schema(description = "Updated list of tag IDs")
        List<Long> selectedTagIds,

        @Schema(description = "Updated list of custom field IDs")
        List<Long> selectedFieldIds
) {}

