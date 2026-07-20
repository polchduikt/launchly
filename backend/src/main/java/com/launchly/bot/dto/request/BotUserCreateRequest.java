package com.launchly.bot.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record BotUserCreateRequest(
    @NotBlank(message = "First name is required") String firstName,
    String lastName,
    String phone,
    String email,
    String gender,
    List<String> tags
) {}
