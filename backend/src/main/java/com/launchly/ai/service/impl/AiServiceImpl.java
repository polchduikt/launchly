package com.launchly.ai.service.impl;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.launchly.ai.dto.AiMessage;
import com.launchly.ai.dto.request.AiChatRequest;
import com.launchly.ai.dto.request.AiSchemaRequest;
import com.launchly.ai.dto.response.AiChatResponse;
import com.launchly.ai.dto.response.AiSchemaResponse;
import com.launchly.ai.dto.response.AiUsageResponse;
import com.launchly.ai.service.AiProviderRouter;
import com.launchly.ai.service.AiService;
import com.launchly.ai.service.AiUsageService;
import com.launchly.billing.entity.Plan;
import com.launchly.billing.service.PlanLimitService;
import com.launchly.common.exception.AppException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiServiceImpl implements AiService {

    private final AiProviderRouter aiProviderRouter;
    private final AiUsageService aiUsageService;
    private final PlanLimitService planLimitService;
    private final ObjectMapper objectMapper;
    private static final int DAILY_LIMIT = 20;

    @Value("classpath:prompts/chat-system.txt")
    private Resource chatPromptResource;

    @Value("classpath:prompts/schema-system.txt")
    private Resource schemaPromptResource;
    private String chatSystemPrompt;
    private String schemaSystemPrompt;

    @PostConstruct
    void init() {
        try {
            chatSystemPrompt = chatPromptResource.getContentAsString(StandardCharsets.UTF_8);
            schemaSystemPrompt = schemaPromptResource.getContentAsString(StandardCharsets.UTF_8);
            log.info("Loaded AI prompt templates (chat: {} chars, schema: {} chars)",
                    chatSystemPrompt.length(), schemaSystemPrompt.length());
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load AI prompt templates", e);
        }
    }

    @Override
    public AiChatResponse chat(AiChatRequest request, Long userId) {
        Plan plan = planLimitService.getActivePlan(userId);
        aiUsageService.checkAndIncrement(userId, plan);
        List<AiMessage> messages = new ArrayList<>();
        messages.add(new AiMessage("system", chatSystemPrompt));
        if (request.history() != null) {
            messages.addAll(request.history());
        }
        messages.add(new AiMessage("user", request.message()));
        String reply = aiProviderRouter.chat(messages, null);
        AiUsageResponse usage = aiUsageService.getUsage(userId, plan);
        int limit = "FREE".equalsIgnoreCase(plan.getName()) ? DAILY_LIMIT : 999999;
        return new AiChatResponse(reply, usage.requestsUsed(), limit);
    }

    @Override
    public AiSchemaResponse generateSchema(AiSchemaRequest request, Long userId) {
        Plan plan = planLimitService.getActivePlan(userId);
        aiUsageService.checkAndIncrement(userId, plan);
        List<AiMessage> messages = new ArrayList<>();
        messages.add(new AiMessage("system", schemaSystemPrompt));

        if (request.history() != null) {
            messages.addAll(request.history());
        }

        messages.add(new AiMessage("user", request.description()));
        boolean requiresActionIntegration = requiresActionIntegration(request);
        boolean requiresUsernameCollection = requiresUsernameCollection(request);
        String rawResponse = aiProviderRouter.chat(
                messages,
                Map.of("type", "json_object"),
                response -> {
                    try {
                        validateGeneratedSchema(cleanJson(response), requiresActionIntegration, requiresUsernameCollection);
                        return true;
                    } catch (Exception e) {
                        return false;
                    }
                }
        );
        String cleanJson = cleanJson(rawResponse);
        log.info("Cleaned JSON: {}", cleanJson);
        JsonNode rootNode = validateGeneratedSchema(cleanJson, requiresActionIntegration, requiresUsernameCollection);
        JsonNode nodesNode = rootNode.path("nodes");
        JsonNode edgesNode = rootNode.path("edges");
        if (requiresUsernameCollection) {
            nodesNode = normalizeUsernameActions(nodesNode);
        }

        AiUsageResponse usage = aiUsageService.getUsage(userId, plan);
        int limit = "FREE".equalsIgnoreCase(plan.getName()) ? DAILY_LIMIT : 999999;
        return new AiSchemaResponse(nodesNode, edgesNode, usage.requestsUsed(), limit);
    }

    private String cleanJson(String rawResponse) {
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

    private boolean requiresActionIntegration(AiSchemaRequest request) {
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

    private boolean requiresUsernameCollection(AiSchemaRequest request) {
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

    private JsonNode validateGeneratedSchema(String cleanJson, boolean requiresActionIntegration, boolean requiresUsernameCollection) {
        try {
            JsonNode rootNode = objectMapper.readTree(cleanJson);
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

    private boolean hasGoogleSheetsColumnMapping(JsonNode nodesNode) {
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

    private JsonNode normalizeUsernameActions(JsonNode nodesNode) {
        try {
            List<Map<String, Object>> nodes = objectMapper.readValue(
                    objectMapper.writeValueAsString(nodesNode),
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

            return objectMapper.valueToTree(nodes);
        } catch (Exception e) {
            log.warn("Failed to normalize username actions: {}", e.getMessage());
            return nodesNode;
        }
    }

    @Override
    public AiUsageResponse getUsage(Long userId) {
        Plan plan = planLimitService.getActivePlan(userId);
        return aiUsageService.getUsage(userId, plan);
    }
}
