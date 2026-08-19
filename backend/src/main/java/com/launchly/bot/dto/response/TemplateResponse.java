package com.launchly.bot.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.List;

@Schema(description = "Bot template details and bundle configuration")
public record TemplateResponse(
        @Schema(description = "Template ID", example = "10")
        Long id,

        @Schema(description = "Unique share code for public link", example = "tmpl_a8f9c2d1")
        String shareCode,

        @Schema(description = "Public share URL", example = "https://launchly.com/templates/share/tmpl_a8f9c2d1")
        String shareUrl,

        @Schema(description = "Template name", example = "E-Commerce Onboarding")
        String name,

        @Schema(description = "Template description")
        String description,

        @Schema(description = "Template avatar preview URL")
        String avatarUrl,

        @Schema(description = "Whether template modification is restricted", example = "false")
        boolean isProtected,

        @Schema(description = "Guide documentation URL")
        String guideUrl,

        @Schema(description = "Video walkthrough URL")
        String videoUrl,

        @Schema(description = "Creator user ID", example = "15")
        Long creatorId,

        @Schema(description = "Creator name", example = "John Doe")
        String creatorName,

        @Schema(description = "Source bot name")
        String sourceBotName,

        @Schema(description = "Source bot description")
        String sourceBotDescription,

        @Schema(description = "Bundled flows count", example = "3")
        int flowCount,

        @Schema(description = "Bundled broadcasts count", example = "2")
        int broadcastCount,

        @Schema(description = "Bundled tags count", example = "5")
        int tagCount,

        @Schema(description = "Bundled custom fields count", example = "4")
        int fieldCount,

        @Schema(description = "Flow nodes count", example = "24")
        int nodeCount,

        @Schema(description = "Flow edges count", example = "30")
        int edgeCount,

        @Schema(description = "Broadcast nodes count")
        int broadcastNodeCount,

        @Schema(description = "Broadcast edges count")
        int broadcastEdgeCount,

        @Schema(description = "Total visual blocks count", example = "36")
        int totalNodeCount,

        @Schema(description = "Total visual connections count", example = "42")
        int totalEdgeCount,

        @Schema(description = "Public page views count", example = "1820")
        int viewsCount,

        @Schema(description = "Total bot installations count", example = "340")
        int installsCount,

        @Schema(description = "Selected flow IDs")
        List<String> selectedFlowIds,

        @Schema(description = "Selected broadcast IDs")
        List<Long> selectedBroadcastIds,

        @Schema(description = "Selected tag IDs")
        List<Long> selectedTagIds,

        @Schema(description = "Selected field IDs")
        List<Long> selectedFieldIds,

        @Schema(description = "Raw JSON broadcasts payload")
        String broadcastsDataJson,

        @Schema(description = "Raw JSON tags payload")
        String tagsDataJson,

        @Schema(description = "Raw JSON fields payload")
        String customFieldsDataJson,

        @Schema(description = "Creation date")
        LocalDateTime createdAt
) {}

