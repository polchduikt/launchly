package com.launchly.broadcast.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
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

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm[:ss][.SSS]")
        LocalDateTime scheduledAt,

        String nodes,

        String edges,

        Long botId,

        Boolean targetAllBots
) {}
