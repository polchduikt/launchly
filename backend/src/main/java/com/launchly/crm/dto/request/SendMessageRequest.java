package com.launchly.crm.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDateTime;

@Schema(description = "Request payload for an agent to send or schedule a Live Chat message")
public record SendMessageRequest(
        @Schema(description = "Text content of the message", example = "Hello! How can I help you today?", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "Message content is required")
        String content,

        @Schema(description = "Optional attached media URL", example = "https://res.cloudinary.com/demo/image/upload/invoice.pdf")
        String mediaUrl,

        @Schema(description = "Media MIME/type: IMAGE, DOCUMENT, AUDIO, VIDEO", example = "IMAGE")
        @Pattern(regexp = "^(?i)(IMAGE|DOCUMENT|AUDIO|VIDEO)?$", message = "Invalid media type. Allowed values: IMAGE, DOCUMENT, AUDIO, VIDEO")
        String mediaType,

        @Schema(description = "Optional future dispatch timestamp for scheduled messages")
        @Future(message = "Scheduled time must be in the future")
        LocalDateTime scheduledAt
) {}
