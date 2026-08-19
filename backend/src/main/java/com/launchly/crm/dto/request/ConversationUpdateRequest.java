package com.launchly.crm.dto.request;

import com.launchly.crm.entity.ConversationStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Request payload to update live conversation state and properties")
public record ConversationUpdateRequest(
        @Schema(description = "Conversation status: OPEN, CLOSED, BOT_ONLY, SNOOZED", example = "OPEN")
        ConversationStatus status,

        @Schema(description = "Mark conversation as unread", example = "false")
        Boolean unread,

        @Schema(description = "Star/favorite conversation", example = "true")
        Boolean favorite,

        @Schema(description = "Assigned conversation tags", example = "[\"SUPPORT\", \"URGENT\"]")
        List<String> tags,

        @Schema(description = "Internal agent notes")
        String notes
) {}

