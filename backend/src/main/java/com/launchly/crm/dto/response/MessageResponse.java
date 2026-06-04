package com.launchly.crm.dto.response;

import com.launchly.crm.entity.SenderType;
import java.time.LocalDateTime;

public record MessageResponse(
        Long id,
        Long conversationId,
        String content,
        SenderType senderType,
        LocalDateTime createdAt
) {}

