package com.launchly.ai.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.JsonNode;

@Schema(description = "Generated workflow schema containing visual nodes and edges")
public record AiSchemaResponse(
    @Schema(description = "Array of workflow node definitions (JSON)")
    JsonNode nodes,

    @Schema(description = "Array of connections/edges between workflow nodes (JSON)")
    JsonNode edges,

    @Schema(description = "Updated AI usage and remaining quota metrics")
    AiUsageResponse usage
) {}

