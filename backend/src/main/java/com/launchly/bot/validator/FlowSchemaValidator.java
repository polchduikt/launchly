package com.launchly.bot.validator;

import com.launchly.common.exception.AppException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import java.util.HashSet;
import java.util.Set;

@Component
public class FlowSchemaValidator {

    public void validateFlowSchema(JsonNode nodes, JsonNode edges) {
        if (nodes == null || !nodes.isArray()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "bot.error.schema_nodes_array");
        }
        if (edges == null || !edges.isArray()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "bot.error.schema_edges_array");
        }

        int startCount = 0;
        Set<String> nodeIds = new HashSet<>();

        for (JsonNode node : nodes) {
            String nodeId = node.path("id").asText(null);
            String type = node.path("type").asText(null);
            if (nodeId == null || type == null) {
                throw new AppException(HttpStatus.BAD_REQUEST, "bot.error.schema_node_id_type");
            }
            nodeIds.add(nodeId);
            if ("START".equalsIgnoreCase(type)) {
                startCount++;
            }
        }

        if (startCount != 1) {
            throw new AppException(HttpStatus.BAD_REQUEST, "bot.error.schema_single_start");
        }

        for (JsonNode edge : edges) {
            String source = edge.path("source").asText(null);
            String target = edge.path("target").asText(null);
            if (source == null || target == null) {
                throw new AppException(HttpStatus.BAD_REQUEST, "bot.error.schema_edge_source_target");
            }
            if (!nodeIds.contains(source)) {
                throw new AppException(HttpStatus.BAD_REQUEST, "bot.error.schema_unknown_source");
            }
            if (!nodeIds.contains(target)) {
                throw new AppException(HttpStatus.BAD_REQUEST, "bot.error.schema_unknown_target");
            }
        }
    }
}
