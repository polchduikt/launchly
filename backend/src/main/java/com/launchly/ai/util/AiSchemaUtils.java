package com.launchly.ai.util;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.launchly.ai.dto.AiMessage;
import com.launchly.ai.dto.request.AiSchemaRequest;
import com.launchly.common.exception.AppException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
public final class AiSchemaUtils {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private AiSchemaUtils() {
    }

    public static String cleanJson(String rawResponse) {
        if (rawResponse == null) return "";
        String cleanJson = rawResponse.trim();
        if (cleanJson.startsWith("```")) {
            if (cleanJson.startsWith("```json")) {
                cleanJson = cleanJson.substring(7).trim();
            } else {
                cleanJson = cleanJson.substring(3).trim();
            }
        }
        if (cleanJson.endsWith("```")) {
            cleanJson = cleanJson.substring(0, cleanJson.length() - 3).trim();
        }
        return cleanJson;
    }

    public static boolean requiresActionIntegration(AiSchemaRequest request) {
        if (request == null) return false;
        StringBuilder text = new StringBuilder(request.description() == null ? "" : request.description());
        if (request.history() != null) {
            for (AiMessage message : request.history()) {
                text.append(' ').append(message.content());
            }
        }

        String value = text.toString().toLowerCase();
        return value.contains("excel")
                || value.contains("google sheets")
                || value.contains("sheets")
                || value.contains("spreadsheet")
                || value.contains("table")
                || value.contains("табли")
                || value.contains("ексел")
                || value.contains("эксел")
                || value.contains("action")
                || value.contains("actions")
                || value.contains("запис");
    }

    public static boolean requiresUsernameCollection(AiSchemaRequest request) {
        if (request == null) return false;
        StringBuilder text = new StringBuilder(request.description() == null ? "" : request.description());
        if (request.history() != null) {
            for (AiMessage message : request.history()) {
                text.append(' ').append(message.content());
            }
        }

        String value = text.toString().toLowerCase();
        return value.contains("username")
                || value.contains("user name")
                || value.contains("telegram username")
                || value.contains("юзернейм")
                || value.contains("юзер");
    }

    public static JsonNode validateGeneratedSchema(String cleanJson, boolean requiresActionIntegration, boolean requiresUsernameCollection) {
        try {
            JsonNode rootNode = OBJECT_MAPPER.readTree(cleanJson);
            JsonNode nodesNode = rootNode.path("nodes");

            if (!nodesNode.isArray()) {
                throw new AppException(HttpStatus.BAD_GATEWAY, "Generated schema is missing a nodes array");
            }

            int startNodeCount = 0;
            boolean hasActionNode = false;
            boolean hasGoogleSheetsAction = false;
            for (JsonNode node : nodesNode) {
                String type = node.path("type").asText("");
                if ("START".equalsIgnoreCase(type)) {
                    startNodeCount++;
                }
                if ("ACTION".equalsIgnoreCase(type)) {
                    hasActionNode = true;
                    JsonNode actionsNode = node.path("data").path("actions");
                    if (actionsNode.isArray()) {
                        for (JsonNode actionNode : actionsNode) {
                            String actionType = actionNode.path("type").asText("");
                            if ("GS_INSERT_ROW".equalsIgnoreCase(actionType)) {
                                hasGoogleSheetsAction = true;
                            }
                        }
                    }
                }
            }

            if (startNodeCount != 1) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Generated schema must contain exactly one START node");
            }

            if (requiresActionIntegration && (!hasActionNode || !hasGoogleSheetsAction)) {
                throw new AppException(HttpStatus.BAD_GATEWAY, "Generated schema must include an ACTION node with GS_INSERT_ROW");
            }

            if (requiresActionIntegration && !hasGoogleSheetsColumnMapping(nodesNode)) {
                throw new AppException(HttpStatus.BAD_GATEWAY, "Generated schema must include Google Sheets column mappings");
            }

            return rootNode;
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to parse generated AI schema as JSON: {}. Cleaned JSON: {}", e.getMessage(), cleanJson);
            throw new AppException(HttpStatus.BAD_GATEWAY, "Generated schema is not a valid JSON");
        }
    }

    public static boolean hasGoogleSheetsColumnMapping(JsonNode nodesNode) {
        if (nodesNode == null) return false;
        for (JsonNode node : nodesNode) {
            JsonNode actionsNode = node.path("data").path("actions");
            if (!actionsNode.isArray()) {
                continue;
            }
            for (JsonNode actionNode : actionsNode) {
                if (!"GS_INSERT_ROW".equalsIgnoreCase(actionNode.path("type").asText(""))) {
                    continue;
                }
                JsonNode mappingsNode = actionNode.path("columnMappings");
                if (mappingsNode.isArray() && mappingsNode.size() > 0) {
                    return true;
                }
            }
        }
        return false;
    }

    public static JsonNode normalizeUsernameActions(JsonNode nodesNode) {
        try {
            List<Map<String, Object>> nodes = OBJECT_MAPPER.readValue(
                    OBJECT_MAPPER.writeValueAsString(nodesNode),
                    new TypeReference<>() {}
            );

            for (Map<String, Object> node : nodes) {
                Object typeObj = node.get("type");
                if (typeObj == null || !"ACTION".equalsIgnoreCase(String.valueOf(typeObj))) {
                    continue;
                }

                Object dataObj = node.get("data");
                if (!(dataObj instanceof Map<?, ?>)) {
                    continue;
                }

                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) dataObj;
                Object actionsObj = data.get("actions");
                if (!(actionsObj instanceof List<?>)) {
                    continue;
                }

                @SuppressWarnings("unchecked")
                List<Map<String, Object>> actions = (List<Map<String, Object>>) actionsObj;
                boolean hasGoogleSheetsAction = actions.stream()
                        .anyMatch(action -> "GS_INSERT_ROW".equalsIgnoreCase(String.valueOf(action.get("type"))));
                if (!hasGoogleSheetsAction) {
                    continue;
                }

                boolean hasUsernameField = actions.stream()
                        .anyMatch(action -> "SET_USER_FIELD".equalsIgnoreCase(String.valueOf(action.get("type")))
                                && "username".equalsIgnoreCase(String.valueOf(action.get("fieldName"))));
                if (!hasUsernameField) {
                    Map<String, Object> setUsernameAction = new LinkedHashMap<>();
                    setUsernameAction.put("type", "SET_USER_FIELD");
                    setUsernameAction.put("fieldName", "username");
                    setUsernameAction.put("fieldValue", "{{username}}");
                    actions.add(0, setUsernameAction);
                }

                for (Map<String, Object> action : actions) {
                    if (!"GS_INSERT_ROW".equalsIgnoreCase(String.valueOf(action.get("type")))) {
                        continue;
                    }
                    Object mappingsObj = action.get("columnMappings");
                    if (!(mappingsObj instanceof List<?>) || ((List<?>) mappingsObj).isEmpty()) {
                        List<Map<String, String>> mappings = new ArrayList<>();
                        Map<String, String> mapping = new LinkedHashMap<>();
                        mapping.put("column", "Username");
                        mapping.put("value", "{{username}}");
                        mappings.add(mapping);
                        action.put("columnMappings", mappings);
                    } else {
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> mappings = (List<Map<String, Object>>) mappingsObj;
                        boolean hasUsernameMapping = mappings.stream()
                                .anyMatch(mapping -> "{{username}}".equals(String.valueOf(mapping.get("value")))
                                        || "username".equalsIgnoreCase(String.valueOf(mapping.get("value"))));
                        if (!hasUsernameMapping) {
                            Map<String, Object> firstMapping = mappings.get(0);
                            firstMapping.put("value", "{{username}}");
                        }
                    }
                }
            }

            return OBJECT_MAPPER.valueToTree(nodes);
        } catch (Exception e) {
            log.warn("Failed to normalize username actions: {}", e.getMessage());
            return nodesNode;
        }
    }
}
