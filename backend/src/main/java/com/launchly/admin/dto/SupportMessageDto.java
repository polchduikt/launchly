package com.launchly.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Schema(description = "Message entry within a support ticket dialogue")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportMessageDto {
    @Schema(description = "Message ID", example = "501")
    private Long id;

    @Schema(description = "Parent ticket ID", example = "101")
    private Long ticketId;

    @Schema(description = "Sender type: USER, MANAGER, SYSTEM", example = "MANAGER")
    private String sender;

    @Schema(description = "Sender display name", example = "Support Manager")
    private String senderName;

    @Schema(description = "Message text content", example = "Hello, how can I assist you?")
    private String text;

    @Schema(description = "Message sent timestamp")
    private LocalDateTime timestamp;
}

