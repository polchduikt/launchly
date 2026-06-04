package com.launchly.crm.dto.response;

import com.launchly.crm.entity.LeadStatus;
import java.time.LocalDateTime;

public record LeadResponse(
        Long id,
        String name,
        String email,
        String phone,
        String source,
        LeadStatus status,
        String notes,
        String data,
        String botUserName,
        String botUserUsername,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
