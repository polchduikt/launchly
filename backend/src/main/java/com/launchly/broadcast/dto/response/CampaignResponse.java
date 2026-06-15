package com.launchly.broadcast.dto.response;

import com.launchly.broadcast.entity.CampaignStatus;
import com.launchly.broadcast.entity.FilterType;
import java.time.LocalDateTime;

public record CampaignResponse(
        Long id,
        String name,
        String message,
        CampaignStatus status,
        FilterType filterType,
        String filterValue,
        LocalDateTime scheduledAt,
        Integer sentCount,
        Integer failedCount,
        Integer totalCount,
        Long botId,
        String nodes,
        String edges,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
