package com.launchly.integration.dto.response;

import com.launchly.integration.entity.IntegrationType;
import java.time.LocalDateTime;

public record IntegrationResponse(
    Long id,
    String name,
    IntegrationType type,
    boolean active,
    Object config,
    Long botId,
    LocalDateTime createdAt
) {}
