package com.launchly.broadcast.dto.response;

import java.time.LocalDateTime;

public record TagResponse(
        Long id,
        String name,
        Long botId,
        LocalDateTime createdAt
) {}
