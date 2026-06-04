package com.launchly.broadcast.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTagRequest(
        @NotBlank(message = "Tag name is required")
        @Size(max = 100, message = "Tag name must be at most 100 characters")
        String name
) {}
