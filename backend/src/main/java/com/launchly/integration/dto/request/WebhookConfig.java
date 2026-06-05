package com.launchly.integration.dto.request;

import java.util.List;

public record WebhookConfig(
    String url,
    List<String> events,
    String secret
) {}
