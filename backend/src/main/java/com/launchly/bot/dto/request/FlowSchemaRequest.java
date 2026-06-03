package com.launchly.bot.dto.request;

import jakarta.validation.constraints.NotNull;

public record FlowSchemaRequest(

        @NotNull(message = "Nodes are required")
        Object nodes,

        @NotNull(message = "Edges are required")
        Object edges
) {}

