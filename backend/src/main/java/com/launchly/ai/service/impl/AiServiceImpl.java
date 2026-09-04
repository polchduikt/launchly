package com.launchly.ai.service.impl;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.launchly.ai.dto.AiMessage;
import com.launchly.ai.dto.request.AiChatRequest;
import com.launchly.ai.dto.request.AiSchemaRequest;
import com.launchly.ai.dto.request.CreateAiSessionRequest;
import com.launchly.ai.dto.request.UpdateAiSessionRequest;
import com.launchly.ai.dto.response.AiChatMessageResponse;
import com.launchly.ai.dto.response.AiChatResponse;
import com.launchly.ai.dto.response.AiChatSessionDetailResponse;
import com.launchly.ai.dto.response.AiChatSessionResponse;
import com.launchly.ai.dto.response.AiSchemaResponse;
import com.launchly.ai.dto.response.AiUsageResponse;
import com.launchly.ai.entity.AiChatMessage;
import com.launchly.ai.entity.AiChatSession;
import com.launchly.ai.repository.AiChatMessageRepository;
import com.launchly.ai.repository.AiChatSessionRepository;
import com.launchly.ai.service.AiProviderRouter;
import com.launchly.ai.service.AiService;
import com.launchly.ai.service.AiUsageService;
import com.launchly.ai.util.AiSchemaUtils;
import com.launchly.auth.entity.User;
import com.launchly.auth.repository.UserRepository;
import com.launchly.billing.entity.Plan;
import com.launchly.billing.service.PlanLimitService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import com.launchly.common.exception.AppException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
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
    private final AiChatSessionRepository aiChatSessionRepository;
    private final AiChatMessageRepository aiChatMessageRepository;
    private final UserRepository userRepository;

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
    @Transactional(readOnly = true)
    public List<AiChatSessionResponse> getSessions(Long userId) {
        List<AiChatSession> sessions = aiChatSessionRepository.findAllByUserIdOrderByUpdatedAtDesc(userId);
        return sessions.stream()
                .map(s -> {
                    String lastMessage = null;
                    if (s.getMessages() != null && !s.getMessages().isEmpty()) {
                        lastMessage = s.getMessages().get(s.getMessages().size() - 1).getContent();
                    }
                    return new AiChatSessionResponse(s.getId(), s.getTitle(), s.getCreatedAt(), s.getUpdatedAt(), lastMessage);
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AiChatSessionDetailResponse getSessionDetails(Long sessionId, Long userId) {
        AiChatSession session = aiChatSessionRepository.findByIdAndUserIdWithMessages(sessionId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "ai.session.not_found"));

        List<AiChatMessageResponse> messages = session.getMessages().stream()
                .map(m -> new AiChatMessageResponse(m.getId(), m.getRole(), m.getContent(), m.getTokensUsed(), m.getCreatedAt()))
                .toList();

        return new AiChatSessionDetailResponse(session.getId(), session.getTitle(), session.getCreatedAt(), session.getUpdatedAt(), messages);
    }

    @Override
    @Transactional
    public AiChatSessionResponse createSession(CreateAiSessionRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "user.error.not_found"));

        String title = request != null && request.title() != null && !request.title().isBlank()
                ? request.title().trim()
                : null;

        AiChatSession session = AiChatSession.builder()
                .user(user)
                .title(title)
                .build();

        session = aiChatSessionRepository.save(session);
        return new AiChatSessionResponse(session.getId(), session.getTitle(), session.getCreatedAt(), session.getUpdatedAt(), null);
    }

    @Override
    @Transactional
    public AiChatSessionResponse updateSessionTitle(Long sessionId, UpdateAiSessionRequest request, Long userId) {
        AiChatSession session = aiChatSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "ai.session.not_found"));

        session.setTitle(request.title().trim());
        session = aiChatSessionRepository.save(session);

        String lastMessage = null;
        if (session.getMessages() != null && !session.getMessages().isEmpty()) {
            lastMessage = session.getMessages().get(session.getMessages().size() - 1).getContent();
        }

        return new AiChatSessionResponse(session.getId(), session.getTitle(), session.getCreatedAt(), session.getUpdatedAt(), lastMessage);
    }

    @Override
    @Transactional
    public void deleteSession(Long sessionId, Long userId) {
        AiChatSession session = aiChatSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "ai.session.not_found"));
        aiChatSessionRepository.delete(session);
    }

    @Override
    @Transactional
    @CircuitBreaker(name = "aiProvider", fallbackMethod = "chatFallback")
    @Retry(name = "aiProvider")
    public AiChatResponse chat(AiChatRequest request, Long userId) {
        Plan plan = planLimitService.getActivePlan(userId);
        aiUsageService.checkTokenLimit(userId, plan);

        AiChatSession session = null;
        List<AiMessage> messages = new ArrayList<>();
        messages.add(new AiMessage("system", chatSystemPrompt));

        if (request.sessionId() != null) {
            session = aiChatSessionRepository.findByIdAndUserIdWithMessages(request.sessionId(), userId)
                    .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "ai.session.not_found"));

            for (AiChatMessage existingMsg : session.getMessages()) {
                messages.add(new AiMessage(existingMsg.getRole(), existingMsg.getContent()));
            }
        } else if (request.history() != null) {
            messages.addAll(request.history());
        }

        messages.add(new AiMessage("user", request.message()));

        String reply = aiProviderRouter.chat(messages, null);

        int estimatedTokens = Math.max(500, (chatSystemPrompt.length() + request.message().length() + (reply != null ? reply.length() : 0)) / 3);
        aiUsageService.recordTokenUsage(userId, plan, estimatedTokens);

        AiUsageResponse usage = aiUsageService.getUsage(userId, plan);

        if (session != null) {
            int userTokens = Math.max(10, request.message().length() / 4);
            int replyTokens = Math.max(10, (reply != null ? reply.length() : 0) / 4);

            AiChatMessage userChatMessage = AiChatMessage.builder()
                    .session(session)
                    .role("user")
                    .content(request.message())
                    .tokensUsed(userTokens)
                    .build();
            session.getMessages().add(userChatMessage);

            AiChatMessage assistantChatMessage = AiChatMessage.builder()
                    .session(session)
                    .role("assistant")
                    .content(reply)
                    .tokensUsed(replyTokens)
                    .build();
            session.getMessages().add(assistantChatMessage);

            if (session.getTitle() == null || session.getTitle().isBlank()) {
                String autoTitle = request.message().trim();
                if (autoTitle.length() > 40) {
                    autoTitle = autoTitle.substring(0, 40) + "...";
                }
                session.setTitle(autoTitle);
            }

            session.setUpdatedAt(LocalDateTime.now());
            session = aiChatSessionRepository.save(session);

            List<AiChatMessageResponse> mappedMessages = session.getMessages().stream()
                    .map(m -> new AiChatMessageResponse(m.getId(), m.getRole(), m.getContent(), m.getTokensUsed(), m.getCreatedAt()))
                    .toList();

            return new AiChatResponse(session.getId(), session.getTitle(), reply, usage, mappedMessages);
        }

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

