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
            throw new AppException(HttpStatus.BAD_REQUEST, "Nodes must be an array");
        }
        if (edges == null || !edges.isArray()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Edges must be an array");
        }

        int startCount = 0;
        Set<String> nodeIds = new HashSet<>();

        for (JsonNode node : nodes) {
            String nodeId = node.path("id").asText(null);
            String type = node.path("type").asText(null);
            if (nodeId == null || type == null) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Each node must have an id and type");
            }
            nodeIds.add(nodeId);
            if ("START".equalsIgnoreCase(type)) {
                startCount++;
            }
        }

        if (startCount != 1) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Flow must have exactly one START node");
        }

        for (JsonNode edge : edges) {
            String source = edge.path("source").asText(null);
            String target = edge.path("target").asText(null);
            if (source == null || target == null) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Each edge must have source and target");
            }
            if (!nodeIds.contains(source)) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Edge references unknown source node: " + source);
            }
            if (!nodeIds.contains(target)) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Edge references unknown target node: " + target);
            }
        }
    }
}
