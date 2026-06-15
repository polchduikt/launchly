package com.launchly.broadcast.dto.request;

import com.launchly.broadcast.entity.FilterType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record CreateCampaignRequest(
        @NotBlank(message = "Campaign name is required")
        String name,

        String message,

        @NotNull(message = "Filter type is required")
        FilterType filterType,

        String filterValue,

        LocalDateTime scheduledAt,

        String nodes,

        String edges
) {}
