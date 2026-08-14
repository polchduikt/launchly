package com.launchly.integration.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record MailchimpConfig(
    @NotBlank(message = "API key is required")
    String apiKey,

    @NotBlank(message = "Audience ID is required")
    String listId,

    String serverPrefix,

    List<String> tags
) {}
