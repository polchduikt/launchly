package com.launchly.support.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportAppealRequest {
    @NotBlank
    private String email;
    private String name;
    @NotBlank
    private String message;
}
