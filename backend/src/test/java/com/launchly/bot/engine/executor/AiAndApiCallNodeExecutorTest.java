package com.launchly.bot.engine.executor;

import com.launchly.ai.dto.AiMessage;
import com.launchly.ai.service.AiProviderRouter;
import com.launchly.analytics.service.AnalyticsService;
import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.engine.model.Position;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.service.BotDialogStateService;
import com.launchly.integration.entity.Integration;
import com.launchly.integration.entity.IntegrationType;
import com.launchly.integration.repository.IntegrationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.message.Message;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiAndApiCallNodeExecutorTest {

    @Mock
    private BotDialogStateService stateService;

    @Mock
    private AiProviderRouter aiProviderRouter;

    @Mock
    private IntegrationRepository integrationRepository;

    @Mock
    private AnalyticsService analyticsService;

    @Mock
    private TelegramClient telegramClient;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Position pos = new Position(0.0, 0.0);

    @Test
    @DisplayName("AiNodeExecutor should handle unconfigured AI provider gracefully")
    void aiNodeExecutor_UnconfiguredProvider() throws Exception {
        AiNodeExecutor executor = new AiNodeExecutor(stateService, aiProviderRouter, integrationRepository, objectMapper, analyticsService);
        assertThat(executor.getType()).isEqualTo(NodeType.AI);

        Bot bot = Bot.builder().name("AiBot").build();
        bot.setId(1L);
        BotUser botUser = BotUser.builder().bot(bot).telegramId(100L).build();

        FlowNode node = new FlowNode("ai-1", NodeType.AI, Map.of(
                "provider", "gemini",
                "prompt", "Answer warmly to the user"
        ), pos);

        String nextNode = executor.execute(node, List.of(), botUser, new Update(), telegramClient);

        assertThat(nextNode).isNull();
        verify(telegramClient).execute(any(SendMessage.class));
        verify(stateService).setExpectedInput(1L, 100L, "ai_input");
    }

    @Test
    @DisplayName("AiNodeExecutor should execute AI prompt and send generated response to user on user reply")
    void aiNodeExecutor_OnUserReply_Success() throws Exception {
        AiNodeExecutor executor = new AiNodeExecutor(stateService, aiProviderRouter, integrationRepository, objectMapper, analyticsService);

        Bot bot = Bot.builder().name("AiBot").build();
        bot.setId(1L);
        BotUser botUser = BotUser.builder().bot(bot).telegramId(100L).build();

        Integration integration = Integration.builder()
                .type(IntegrationType.GEMINI)
                .active(true)
                .config("{\"apiKey\":\"test-key-123\"}")
                .build();

        when(integrationRepository.findByBotIdAndType(1L, IntegrationType.GEMINI)).thenReturn(Optional.of(integration));
        when(stateService.getExpectedInput(1L, 100L)).thenReturn(Optional.of("ai_input"));
        when(aiProviderRouter.chat(anyList(), isNull(), eq("gemini"), eq("test-key-123"))).thenReturn("Hello from AI assistant!");

        Update update = new Update();
        Message message = new Message();
        message.setText("How are you?");
        update.setMessage(message);

        FlowNode node = new FlowNode("ai-1", NodeType.AI, Map.of(
                "provider", "gemini",
                "prompt", "Answer warmly to the user"
        ), pos);

        List<FlowEdge> edges = List.of(new FlowEdge("e1", "ai-1", "after-ai", null));

        String nextNode = executor.execute(node, edges, botUser, update, telegramClient);

        assertThat(nextNode).isEqualTo("after-ai");
        verify(telegramClient).execute(any(SendMessage.class));
    }

    @Test
    @DisplayName("ApiCallNodeExecutor should return API_CALL type and continue flow")
    void apiCallNodeExecutor_Success() {
        ApiCallNodeExecutor executor = new ApiCallNodeExecutor(stateService);
        assertThat(executor.getType()).isEqualTo(NodeType.API_CALL);

        Bot bot = Bot.builder().name("ApiBot").build();
        bot.setId(1L);
        BotUser botUser = BotUser.builder().bot(bot).telegramId(100L).build();

        FlowNode node = new FlowNode("api-1", NodeType.API_CALL, Map.of(
                "url", "http://127.0.0.1:65534/non-existent",
                "method", "GET"
        ), pos);

        List<FlowEdge> edges = List.of(new FlowEdge("e1", "api-1", "after-api", null));

        String nextNode = executor.execute(node, edges, botUser, new Update(), telegramClient);
        assertThat(nextNode).isEqualTo("after-api");
    }
}
