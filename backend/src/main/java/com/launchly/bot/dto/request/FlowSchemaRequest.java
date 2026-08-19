package com.launchly.bot.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Flow schema visual graph definition containing nodes and edges")
public record FlowSchemaRequest(

        @Schema(description = "Array of visual bot nodes (blocks, coordinates, handlers)", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull(message = "Nodes are required")
        Object nodes,

        @Schema(description = "Array of visual connection edges linking nodes", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull(message = "Edges are required")
        Object edges
) {}


