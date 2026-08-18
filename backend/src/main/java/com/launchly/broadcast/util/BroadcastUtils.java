package com.launchly.broadcast.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public final class BroadcastUtils {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private BroadcastUtils() {
    }

    public static String extractFirstMessageText(String nodesJson, String edgesJson, String defaultMessage) {
        if (nodesJson == null || nodesJson.trim().isEmpty() || "[]".equals(nodesJson)) {
            return defaultMessage != null ? defaultMessage : "";
        }
        try {
            JsonNode nodesNode = OBJECT_MAPPER.readTree(nodesJson);
            JsonNode edgesNode = edgesJson != null && !edgesJson.trim().isEmpty() ? OBJECT_MAPPER.readTree(edgesJson) : OBJECT_MAPPER.createArrayNode();

            String startNodeId = null;
            for (JsonNode n : nodesNode) {
                if ("START_BROADCAST".equals(n.get("type").asText())) {
                    startNodeId = n.get("id").asText();
                    break;
                }
            }

            if (startNodeId == null) {
                return defaultMessage != null ? defaultMessage : "";
            }

            String firstConnectedNodeId = null;
            for (JsonNode e : edgesNode) {
                if (startNodeId.equals(e.get("source").asText())) {
                    firstConnectedNodeId = e.get("target").asText();
                    break;
                }
            }

            if (firstConnectedNodeId == null) {
                return defaultMessage != null ? defaultMessage : "";
            }

            for (JsonNode n : nodesNode) {
                if (firstConnectedNodeId.equals(n.get("id").asText())) {
                    if ("MESSAGE".equalsIgnoreCase(n.get("type").asText())) {
                        JsonNode data = n.get("data");
                        if (data != null && data.has("text")) {
                            return data.get("text").asText();
                        }
                    }
                    break;
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse campaign flow to extract message: {}", e.getMessage());
        }
        return defaultMessage != null ? defaultMessage : "";
    }
}
