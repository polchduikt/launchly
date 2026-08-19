package com.launchly.bot.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Request payload to export/create a reusable bot template")
public record CreateTemplateRequest(
        @Schema(description = "Source bot ID", example = "5")
        Long botId,

        @Schema(description = "Template title", example = "E-Commerce Onboarding & Order Flow")
        String name,

        @Schema(description = "Template description", example = "Ready-to-use Telegram store template with cart and order tracking")
        String description,

        @Schema(description = "Template preview image URL")
        String avatarUrl,

        @Schema(description = "Whether template schema is protected from modification", example = "false")
        boolean isProtected,

        @Schema(description = "External user guide documentation URL")
        String guideUrl,

        @Schema(description = "Video tutorial walkthrough URL")
        String videoUrl,

        @Schema(description = "List of automation flow IDs to bundle into template")
        List<String> selectedFlowIds,

        @Schema(description = "List of broadcast IDs to bundle into template")
        List<Long> selectedBroadcastIds,

        @Schema(description = "List of tag IDs to bundle into template")
        List<Long> selectedTagIds,

        @Schema(description = "List of custom field IDs to bundle into template")
        List<Long> selectedFieldIds
) {}

