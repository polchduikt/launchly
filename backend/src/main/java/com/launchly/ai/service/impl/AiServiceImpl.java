package com.launchly.ai.service.impl;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.launchly.ai.client.GroqClient;
import com.launchly.ai.dto.GroqMessage;
import com.launchly.ai.dto.request.AiChatRequest;
import com.launchly.ai.dto.request.AiSchemaRequest;
import com.launchly.ai.dto.response.AiChatResponse;
import com.launchly.ai.dto.response.AiSchemaResponse;
import com.launchly.ai.dto.response.AiUsageResponse;
import com.launchly.ai.service.AiService;
import com.launchly.ai.service.AiUsageService;
import com.launchly.billing.entity.Plan;
import com.launchly.billing.service.PlanLimitService;
import com.launchly.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiServiceImpl implements AiService {

    private final GroqClient groqClient;
    private final AiUsageService aiUsageService;
    private final PlanLimitService planLimitService;
    private final ObjectMapper objectMapper;

    private static final int DAILY_LIMIT = 20;

    private static final String CHAT_SYSTEM_PROMPT = """
            You are Launchly AI Assistant — a helpful assistant for business owners \
            using the Launchly platform. You help with:
            - Understanding how to use the bot constructor
            - Analyzing CRM data and giving business insights  
            - Answering questions about orders, leads, and broadcasts
            - Suggesting improvements to bot flows
            Always be concise and practical. Respond in the same language as the user.""";

    private static final String SCHEMA_SYSTEM_PROMPT = """
            You are a Launchly bot flow generator. Generate a valid JSON flow schema.
            Available node types: START, MESSAGE, BUTTON, INPUT, CONDITION, ORDER, LEAD, ACTION, END
            Rules:
            - Exactly one START node
            - Every node must have unique id (use UUID format)
            - Every node must have: id, type, data, position (x, y)
            - Edges must have: id, source, target
            - Return ONLY valid JSON, no explanation, no markdown
            Schema format:
            {
              "nodes": [...],
              "edges": [...]
            }""";

    @Override
    public AiChatResponse chat(AiChatRequest request, Long userId) {
        Plan plan = planLimitService.getActivePlan(userId);
        aiUsageService.checkAndIncrement(userId, plan);
        List<GroqMessage> messages = new ArrayList<>();
        messages.add(new GroqMessage("system", CHAT_SYSTEM_PROMPT));
        if (request.history() != null) {
            messages.addAll(request.history());
        }
        messages.add(new GroqMessage("user", request.message()));
        String reply = groqClient.chat(messages);
        AiUsageResponse usage = aiUsageService.getUsage(userId, plan);
        int limit = "FREE".equalsIgnoreCase(plan.getName()) ? DAILY_LIMIT : 999999;
        return new AiChatResponse(reply, usage.requestsUsed(), limit);
    }

    @Override
    public AiSchemaResponse generateSchema(AiSchemaRequest request, Long userId) {
        Plan plan = planLimitService.getActivePlan(userId);
        aiUsageService.checkAndIncrement(userId, plan);
        List<GroqMessage> messages = new ArrayList<>();
        messages.add(new GroqMessage("system", SCHEMA_SYSTEM_PROMPT));

        if (request.history() != null) {
            messages.addAll(request.history());
        }

        messages.add(new GroqMessage("user", request.description()));
        String rawResponse = groqClient.chat(messages);
        String cleanJson = rawResponse.trim();
        if (cleanJson.startsWith("```")) {
            int firstNewLine = cleanJson.indexOf("\n");
            int lastBackticks = cleanJson.lastIndexOf("```");
            if (firstNewLine != -1 && lastBackticks != -1 && lastBackticks > firstNewLine) {
                cleanJson = cleanJson.substring(firstNewLine + 1, lastBackticks).trim();
            }
        }

        JsonNode rootNode;
        try {
            rootNode = objectMapper.readTree(cleanJson);
        } catch (Exception e) {
            log.error("Failed to parse generated AI schema as JSON: {}. Cleaned JSON: {}", e.getMessage(), cleanJson);
            throw new AppException(HttpStatus.BAD_GATEWAY, "Generated schema is not a valid JSON");
        }

        JsonNode nodesNode = rootNode.path("nodes");
        JsonNode edgesNode = rootNode.path("edges");

        if (!nodesNode.isArray()) {
            throw new AppException(HttpStatus.BAD_GATEWAY, "Generated schema is missing a nodes array");
        }

        int startNodeCount = 0;
        for (JsonNode node : nodesNode) {
            String type = node.path("type").asText("");
            if ("START".equalsIgnoreCase(type)) {
                startNodeCount++;
            }
        }

        if (startNodeCount != 1) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Generated schema must contain exactly one START node");
        }

        AiUsageResponse usage = aiUsageService.getUsage(userId, plan);
        int limit = "FREE".equalsIgnoreCase(plan.getName()) ? DAILY_LIMIT : 999999;
        return new AiSchemaResponse(nodesNode, edgesNode, usage.requestsUsed(), limit);
    }

    @Override
    public AiUsageResponse getUsage(Long userId) {
        Plan plan = planLimitService.getActivePlan(userId);
        return aiUsageService.getUsage(userId, plan);
    }
}
