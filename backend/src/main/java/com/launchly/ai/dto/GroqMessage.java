package com.launchly.ai.dto;

public record GroqMessage(
    String role,
    String content
) {}
