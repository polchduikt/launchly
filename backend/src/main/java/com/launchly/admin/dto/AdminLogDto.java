package com.launchly.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Schema(description = "System log entry")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminLogDto {
    @Schema(description = "Log entry ID", example = "log_18726")
    private String id;

    @Schema(description = "Log severity level: INFO, WARN, ERROR, DEBUG", example = "INFO")
    private String level;

    @Schema(description = "Originating service name", example = "bot-service")
    private String service;

    @Schema(description = "Log message text", example = "Registered bot 42 for long polling")
    private String message;

    @Schema(description = "Associated user email if applicable", example = "user@example.com")
    private String userEmail;

    @Schema(description = "Log timestamp")
    private LocalDateTime timestamp;
}

