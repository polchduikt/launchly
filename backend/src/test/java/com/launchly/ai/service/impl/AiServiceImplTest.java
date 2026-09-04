package com.launchly.ai.service.impl;

import tools.jackson.databind.ObjectMapper;
import com.launchly.ai.dto.request.AiChatRequest;
import com.launchly.ai.dto.request.AiSchemaRequest;
import com.launchly.ai.dto.request.CreateAiSessionRequest;
import com.launchly.ai.dto.request.UpdateAiSessionRequest;
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
import com.launchly.ai.service.AiUsageService;
import com.launchly.auth.entity.User;
import com.launchly.auth.repository.UserRepository;
import com.launchly.billing.entity.Plan;
import com.launchly.billing.service.PlanLimitService;
import com.launchly.common.exception.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiServiceImplTest {

    @Mock
    private AiProviderRouter aiProviderRouter;

    @Mock
    private AiUsageService aiUsageService;

    @Mock
    private PlanLimitService planLimitService;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private AiChatSessionRepository aiChatSessionRepository;

    @Mock
    private AiChatMessageRepository aiChatMessageRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AiServiceImpl aiService;

    private Plan testPlan;
    private User testUser;

    @BeforeEach
    void setUp() {
        testPlan = new Plan();
        testPlan.setId(1L);
        testPlan.setName("PRO");

        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@launchly.app");
    }

    @Test
    @DisplayName("Should execute chat and record usage successfully")
    void chat_Success() {
        when(planLimitService.getActivePlan(1L)).thenReturn(testPlan);
        when(aiProviderRouter.chat(anyList(), any())).thenReturn("Hello from AI");
        when(aiUsageService.getUsage(1L, testPlan)).thenReturn(new AiUsageResponse(100L, 1000L, 900L, 90, "2026-09-01T00:00:00Z"));

        AiChatRequest request = new AiChatRequest("Hello", List.of());
        AiChatResponse response = aiService.chat(request, 1L);

        assertThat(response).isNotNull();
        assertThat(response.reply()).isEqualTo("Hello from AI");
        verify(aiUsageService).recordTokenUsage(anyLong(), any(Plan.class), anyInt());
    }

    @Test
    @DisplayName("Should execute chat with session and persist messages")
    void chat_WithSession_PersistsMessages() {
        AiChatSession session = AiChatSession.builder()
                .user(testUser)
                .title(null)
                .messages(new ArrayList<>())
                .build();
        session.setId(10L);
        session.setCreatedAt(LocalDateTime.now());
        session.setUpdatedAt(LocalDateTime.now());

        when(planLimitService.getActivePlan(1L)).thenReturn(testPlan);
        when(aiChatSessionRepository.findByIdAndUserIdWithMessages(10L, 1L)).thenReturn(Optional.of(session));
        when(aiProviderRouter.chat(anyList(), any())).thenReturn("Assistant reply");
        when(aiChatSessionRepository.save(any(AiChatSession.class))).thenAnswer(inv -> inv.getArgument(0));
        when(aiUsageService.getUsage(1L, testPlan)).thenReturn(new AiUsageResponse(100L, 1000L, 900L, 90, "2026-09-01T00:00:00Z"));

        AiChatRequest request = new AiChatRequest(10L, "How to build a bot?", null);
        AiChatResponse response = aiService.chat(request, 1L);

        assertThat(response).isNotNull();
        assertThat(response.sessionId()).isEqualTo(10L);
        assertThat(response.reply()).isEqualTo("Assistant reply");
        assertThat(response.messages()).hasSize(2);
        assertThat(session.getMessages()).hasSize(2);
        assertThat(session.getTitle()).isEqualTo("How to build a bot?");
    }

    @Test
    @DisplayName("Should create and retrieve AI sessions")
    void session_CRUD_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        AiChatSession savedSession = AiChatSession.builder()
                .user(testUser)
                .title("My Test Session")
                .messages(new ArrayList<>())
                .build();
        savedSession.setId(5L);
        savedSession.setCreatedAt(LocalDateTime.now());
        savedSession.setUpdatedAt(LocalDateTime.now());

        when(aiChatSessionRepository.save(any(AiChatSession.class))).thenReturn(savedSession);
        when(aiChatSessionRepository.findAllByUserIdOrderByUpdatedAtDesc(1L)).thenReturn(List.of(savedSession));
        when(aiChatSessionRepository.findByIdAndUserIdWithMessages(5L, 1L)).thenReturn(Optional.of(savedSession));
        when(aiChatSessionRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(savedSession));

        AiChatSessionResponse created = aiService.createSession(new CreateAiSessionRequest("My Test Session"), 1L);
        assertThat(created.id()).isEqualTo(5L);
        assertThat(created.title()).isEqualTo("My Test Session");

        List<AiChatSessionResponse> list = aiService.getSessions(1L);
        assertThat(list).hasSize(1);
        assertThat(list.get(0).id()).isEqualTo(5L);

        AiChatSessionDetailResponse details = aiService.getSessionDetails(5L, 1L);
        assertThat(details.id()).isEqualTo(5L);

        AiChatSessionResponse updated = aiService.updateSessionTitle(5L, new UpdateAiSessionRequest("Updated Title"), 1L);
        assertThat(updated.title()).isEqualTo("Updated Title");

        aiService.deleteSession(5L, 1L);
        verify(aiChatSessionRepository).delete(savedSession);
    }

    @Test
    @DisplayName("Should throw ServiceUnavailable when chat fallback is invoked")
    void chatFallback_ThrowsServiceUnavailable() {
        AiChatRequest request = new AiChatRequest("Hello", List.of());

        assertThatThrownBy(() -> aiService.chatFallback(request, 1L, new RuntimeException("API down")))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.SERVICE_UNAVAILABLE);
    }

    @Test
    @DisplayName("Should throw ServiceUnavailable when generateSchema fallback is invoked")
    void generateSchemaFallback_ThrowsServiceUnavailable() {
        AiSchemaRequest request = new AiSchemaRequest("E-commerce bot", List.of());

        assertThatThrownBy(() -> aiService.generateSchemaFallback(request, 1L, new RuntimeException("API down")))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.SERVICE_UNAVAILABLE);
    }

    @Test
    @DisplayName("Should return usage for user")
    void getUsage_Success() {
        when(planLimitService.getActivePlan(1L)).thenReturn(testPlan);
        when(aiUsageService.getUsage(1L, testPlan)).thenReturn(new AiUsageResponse(50L, 1000L, 950L, 95, "2026-09-01T00:00:00Z"));

        AiUsageResponse usage = aiService.getUsage(1L);

        assertThat(usage).isNotNull();
        assertThat(usage.tokensUsed()).isEqualTo(50L);
    }
}
