package com.launchly.bot.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransferOwnershipRequest {
    @NotNull(message = "newOwnerUserId is required")
    private Long newOwnerUserId;
}
