package com.launchly.crm.dto.response;

import com.launchly.crm.entity.SenderType;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "Message entry in a Live Chat conversation thread")
public record MessageResponse(
        @Schema(description = "Message ID", example = "105")
        Long id,

        @Schema(description = "Conversation ID", example = "10")
        Long conversationId,

        @Schema(description = "Message text content", example = "Дякуємо за звернення!")
        String content,

        @Schema(description = "Sender entity type: USER, BOT, AGENT", example = "AGENT")
        SenderType senderType,

        @Schema(description = "Attached media URL")
        String mediaUrl,

        @Schema(description = "Media type (IMAGE, DOCUMENT, etc.)")
        String mediaType,

        @Schema(description = "Message creation timestamp")
        LocalDateTime createdAt,

        @Schema(description = "Scheduled delivery timestamp")
        LocalDateTime scheduledAt,

        @Schema(description = "Whether message is delivered to Telegram", example = "true")
        Boolean sent
) {}

