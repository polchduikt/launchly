package com.launchly.bot.dto.response;

public record FlowSchemaResponse(
        Long id,
        int version,
        Object nodes,
        Object edges
) {}
