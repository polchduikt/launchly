package com.launchly.bot.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "Request payload to transfer primary bot ownership to another user")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransferOwnershipRequest {
    @Schema(description = "User ID of the new owner", example = "12", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "newOwnerUserId is required")
    private Long newOwnerUserId;
}

