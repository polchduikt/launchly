package com.launchly.crm.dto.response;

import com.launchly.crm.entity.ConversationStatus;
import java.time.LocalDateTime;
import java.util.List;

public record ConversationResponse(
        Long id,
        ConversationStatus status,
        Boolean unread,
        Boolean favorite,
        List<String> tags,
        String notes,
        String botUserName,
        String botUserUsername,
        Long botUserTelegramId,
        String botUserPhotoUrl,
        String lastMessage,
        LocalDateTime lastMessageAt,
        LocalDateTime updatedAt,
        Long botId,
        String botName
) {}
