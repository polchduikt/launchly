package com.launchly.crm.dto.response;

import com.launchly.crm.entity.ConversationStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.List;

@Schema(description = "Live Chat conversation preview and contact details")
public record ConversationResponse(
        @Schema(description = "Conversation ID", example = "10")
        Long id,

        @Schema(description = "Conversation status: OPEN, CLOSED, BOT_ONLY, SNOOZED", example = "OPEN")
        ConversationStatus status,

        @Schema(description = "Whether conversation has unread incoming messages", example = "true")
        Boolean unread,

        @Schema(description = "Starred / favorite indicator", example = "false")
        Boolean favorite,

        @Schema(description = "Assigned tags", example = "[\"SUPPORT\", \"VIP\"]")
        List<String> tags,

        @Schema(description = "Internal agent notes")
        String notes,

        @Schema(description = "Contact full name", example = "Олександр Коваленко")
        String botUserName,

        @Schema(description = "Contact Telegram username", example = "oleksandr_k")
        String botUserUsername,

        @Schema(description = "Contact Telegram ID", example = "987654321")
        Long botUserTelegramId,

        @Schema(description = "Contact avatar photo URL")
        String botUserPhotoUrl,

        @Schema(description = "Snippet of most recent message in thread", example = "Доброго дня! Як оформити замовлення?")
        String lastMessage,

        @Schema(description = "Timestamp of last message")
        LocalDateTime lastMessageAt,

        @Schema(description = "Last update timestamp")
        LocalDateTime updatedAt,

        @Schema(description = "Belonging Bot ID", example = "5")
        Long botId,

        @Schema(description = "Belonging Bot Name", example = "Sales Bot")
        String botName
) {}

