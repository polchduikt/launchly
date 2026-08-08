package com.launchly.bot.dto.request;

import java.util.List;

public record CreateTemplateRequest(
        Long botId,
        String name,
        String description,
        String avatarUrl,
        boolean isProtected,
        String guideUrl,
        String videoUrl,
        List<String> selectedFlowIds,
        List<Long> selectedBroadcastIds,
        List<Long> selectedTagIds,
        List<Long> selectedFieldIds
) {}
