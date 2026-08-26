package com.launchly.ai.service.impl;

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
import com.launchly.ai.util.AiSchemaUtils;
import com.launchly.billing.entity.Plan;
import com.launchly.billing.service.PlanLimitService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import com.launchly.common.exception.AppException;
import org.springframework.http.HttpStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
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

    @Value("${ai.prompt.chat-path:classpath:prompts/chat-system.txt}")
    private Resource chatPromptResource;

    @Value("${ai.prompt.schema-path:classpath:prompts/schema-system.txt}")
    private Resource schemaPromptResource;

    private String chatSystemPrompt = "You are Launchly AI Assistant — a helpful assistant for business owners.";
    private String schemaSystemPrompt = "You are a Launchly bot flow generator.";

    @PostConstruct
    void init() {
        try {
            if (chatPromptResource != null && chatPromptResource.exists()) {
                chatSystemPrompt = chatPromptResource.getContentAsString(StandardCharsets.UTF_8);
            }
            if (schemaPromptResource != null && schemaPromptResource.exists()) {
                schemaSystemPrompt = schemaPromptResource.getContentAsString(StandardCharsets.UTF_8);
            }
            log.info("Loaded AI prompt templates (chat: {} chars, schema: {} chars)",
                    chatSystemPrompt.length(), schemaSystemPrompt.length());
        } catch (Exception e) {
            log.warn("Could not load external AI prompt templates, using default fallbacks: {}", e.getMessage());
        }
    }

    @Override
    @CircuitBreaker(name = "aiProvider", fallbackMethod = "chatFallback")
    @Retry(name = "aiProvider")
    public AiChatResponse chat(AiChatRequest request, Long userId) {
        Plan plan = planLimitService.getActivePlan(userId);
        aiUsageService.checkTokenLimit(userId, plan);

        List<AiMessage> messages = new ArrayList<>();
        messages.add(new AiMessage("system", chatSystemPrompt));
        if (request.history() != null) {
            messages.addAll(request.history());
        }
        messages.add(new AiMessage("user", request.message()));

        String reply = aiProviderRouter.chat(messages, null);

        int estimatedTokens = Math.max(500, (chatSystemPrompt.length() + request.message().length() + (reply != null ? reply.length() : 0)) / 3);
        aiUsageService.recordTokenUsage(userId, plan, estimatedTokens);

        AiUsageResponse usage = aiUsageService.getUsage(userId, plan);
        return new AiChatResponse(reply, usage);
    }

    @Override
    @CircuitBreaker(name = "aiProvider", fallbackMethod = "generateSchemaFallback")
    @Retry(name = "aiProvider")
    public AiSchemaResponse generateSchema(AiSchemaRequest request, Long userId) {
        Plan plan = planLimitService.getActivePlan(userId);
        aiUsageService.checkTokenLimit(userId, plan);

        List<AiMessage> messages = new ArrayList<>();
        messages.add(new AiMessage("system", schemaSystemPrompt));

        if (request.history() != null) {
            messages.addAll(request.history());
        }

        messages.add(new AiMessage("user", request.description()));
        boolean requiresActionIntegration = AiSchemaUtils.requiresActionIntegration(request);
        boolean requiresUsernameCollection = AiSchemaUtils.requiresUsernameCollection(request);
        String rawResponse = aiProviderRouter.chat(
                messages,
                Map.of("type", "json_object"),
                response -> {
                    try {
                        AiSchemaUtils.validateGeneratedSchema(AiSchemaUtils.cleanJson(response), requiresActionIntegration, requiresUsernameCollection);
                        return true;
                    } catch (Exception e) {
                        return false;
                    }
                }
        );
        String cleanJson = AiSchemaUtils.cleanJson(rawResponse);
        log.info("Cleaned JSON: {}", cleanJson);
        JsonNode rootNode = AiSchemaUtils.validateGeneratedSchema(cleanJson, requiresActionIntegration, requiresUsernameCollection);
        JsonNode nodesNode = rootNode.path("nodes");
        JsonNode edgesNode = rootNode.path("edges");
        if (requiresUsernameCollection) {
            nodesNode = AiSchemaUtils.normalizeUsernameActions(nodesNode);
        }

        int estimatedTokens = Math.max(1000, (schemaSystemPrompt.length() + request.description().length() + rawResponse.length()) / 3);
        aiUsageService.recordTokenUsage(userId, plan, estimatedTokens);

        AiUsageResponse usage = aiUsageService.getUsage(userId, plan);
        return new AiSchemaResponse(nodesNode, edgesNode, usage);
    }

    public AiChatResponse chatFallback(AiChatRequest request, Long userId, Throwable t) {
        if (t instanceof AppException appException) {
            throw appException;
        }
        log.warn("AI chat fallback triggered for userId {}: {}", userId, t.getMessage());
        throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "ai.error.provider_unavailable");
    }

    public AiSchemaResponse generateSchemaFallback(AiSchemaRequest request, Long userId, Throwable t) {
        if (t instanceof AppException appException) {
            throw appException;
        }
        log.warn("AI generateSchema fallback triggered for userId {}: {}", userId, t.getMessage());
        throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "ai.error.provider_unavailable");
    }

    @Override
    public AiUsageResponse getUsage(Long userId) {
        Plan plan = planLimitService.getActivePlan(userId);
        return aiUsageService.getUsage(userId, plan);
    }
}

