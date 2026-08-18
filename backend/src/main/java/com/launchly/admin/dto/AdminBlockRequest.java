package com.launchly.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "Payload for blocking an entity (user, automation, broadcast) by administrator")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminBlockRequest {

    @Schema(description = "Primary block reason / rule violation key", example = "admin.reason_rules")
    private String reason;

    @Schema(description = "Detailed explanation of block decision", example = "Spamming users with unsolicited advertisements.")
    private String details;
}