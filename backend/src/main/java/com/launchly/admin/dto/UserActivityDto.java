package com.launchly.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Schema(description = "User audit trail / activity log entry")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserActivityDto {
    @Schema(description = "Activity log ID", example = "1001")
    private Long id;

    @Schema(description = "ID of affected entity (bot, flow, broadcast, etc.)", example = "42")
    private Long targetId;

    @Schema(description = "Name or label of target entity", example = "Support Bot")
    private String targetName;

    @Schema(description = "Activity event title", example = "Bot Created")
    private String title;

    @Schema(description = "Detailed activity description", example = "User registered new Telegram bot @support_assistant_bot")
    private String description;

    @Schema(description = "Activity category: auth, bot, broadcast, billing, system", example = "bot")
    private String category;

    @Schema(description = "Visual badge identifier", example = "CREATE")
    private String badge;

    @Schema(description = "Timestamp when activity occurred")
    private LocalDateTime timestamp;
}

