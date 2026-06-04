package com.launchly.crm.dto.response;

import com.launchly.crm.entity.ConversationStatus;
import java.time.LocalDateTime;

public record ConversationResponse(
        Long id,
        ConversationStatus status,
        String botUserName,
        String botUserUsername,
        Long botUserTelegramId,
        String lastMessage,
        LocalDateTime lastMessageAt,
        LocalDateTime updatedAt
) {}
