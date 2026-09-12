package com.launchly.bot.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Visual workflow schema graph response")
public record FlowSchemaResponse(
        @Schema(description = "Flow schema ID", example = "2")
        Long id,

        @Schema(description = "Schema version number", example = "1")
        int version,

        @Schema(description = "JSON array of visual nodes")
        Object nodes,

        @Schema(description = "JSON array of visual connection edges")
        Object edges,

        @Schema(description = "JSON array of published visual nodes")
        Object publishedNodes,

        @Schema(description = "JSON array of published visual connection edges")
        Object publishedEdges
) {
    public FlowSchemaResponse(Long id, int version, Object nodes, Object edges) {
        this(id, version, nodes, edges, nodes, edges);
    }
}

