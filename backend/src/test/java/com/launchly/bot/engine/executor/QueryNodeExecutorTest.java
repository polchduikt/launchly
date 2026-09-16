package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.engine.model.Position;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.repository.BotUserInteractionRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.service.BotDialogStateService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QueryNodeExecutorTest {

    @Mock
    private BotUserRepository botUserRepository;

    @Mock
    private BotUserInteractionRepository interactionRepository;

    @Mock
    private BotDialogStateService stateService;

    @Mock
    private TelegramClient telegramClient;

    private QueryNodeExecutor executor;
    private final Position pos = new Position(0.0, 0.0);

    @BeforeEach
    void setUp() {
        executor = new QueryNodeExecutor(botUserRepository, interactionRepository, stateService, new ObjectMapper());
    }

    @Test
    @DisplayName("Should return QUERY node type")
    void getType_Success() {
        assertThat(executor.getType()).isEqualTo(NodeType.QUERY);
    }

    @Test
    @DisplayName("Should query candidate by metadata filter, exclude self and interacted, and route to found edge")
    void execute_CandidateFound_Success() {
        Bot bot = Bot.builder().name("DatingBot").build();
        bot.setId(1L);
        BotUser currentUser = BotUser.builder()
                .bot(bot)
                .telegramId(100L)
                .firstName("Alex")
                .metadata("{\"looking_for\":\"female\",\"city\":\"Kyiv\"}")
                .build();
        currentUser.setId(1L);

        BotUser candidate1 = BotUser.builder()
                .bot(bot)
                .telegramId(200L)
                .firstName("Oksana")
                .username("oksana_kyiv")
                .metadata("{\"gender\":\"female\",\"city\":\"Kyiv\",\"age\":\"23\"}")
                .build();
        candidate1.setId(2L);

        BotUser candidate2 = BotUser.builder()
                .bot(bot)
                .telegramId(300L)
                .firstName("Ivan")
                .username("ivan_lviv")
                .metadata("{\"gender\":\"male\",\"city\":\"Lviv\",\"age\":\"25\"}")
                .build();
        candidate2.setId(3L);

        when(interactionRepository.findInteractedTargetTelegramIds(eq(1L), eq(100L), any()))
                .thenReturn(List.of());
        when(botUserRepository.findAllByBotId(1L)).thenReturn(List.of(currentUser, candidate1, candidate2));
        when(stateService.getSessionData(1L, 100L)).thenReturn(Map.of("city", "Kyiv"));

        FlowNode node = new FlowNode("query-1", NodeType.QUERY, Map.of(
                "outputPrefix", "found_user",
                "excludeSelf", true,
                "excludeInteractions", List.of("like", "dislike"),
                "filters", List.of(
                        Map.of("field", "gender", "operator", "equals", "value", "female"),
                        Map.of("field", "city", "operator", "equals", "value", "Kyiv")
                )
        ), pos);

        List<FlowEdge> edges = List.of(
                new FlowEdge("e1", "query-1", "msg-found", "found"),
                new FlowEdge("e2", "query-1", "msg-empty", "not_found")
        );

        String nextNodeId = executor.execute(node, edges, currentUser, new Update(), telegramClient);

        assertThat(nextNodeId).isEqualTo("msg-found");
        verify(stateService).setSessionData(1L, 100L, "found_user.telegram_id", "200");
        verify(stateService).setSessionData(1L, 100L, "found_user.first_name", "Oksana");
        verify(stateService).setSessionData(1L, 100L, "found_user.age", "23");
    }

    @Test
    @DisplayName("Should route to not_found handle when no candidates match filters")
    void execute_NoCandidates_NotFoundHandle() {
        Bot bot = Bot.builder().name("DatingBot").build();
        bot.setId(1L);
        BotUser currentUser = BotUser.builder().bot(bot).telegramId(100L).firstName("Alex").build();
        currentUser.setId(1L);

        when(botUserRepository.findAllByBotId(1L)).thenReturn(List.of(currentUser));
        when(stateService.getSessionData(1L, 100L)).thenReturn(Map.of());

        FlowNode node = new FlowNode("query-1", NodeType.QUERY, Map.of(
                "filters", List.of(Map.of("field", "gender", "operator", "equals", "value", "female"))
        ), pos);

        List<FlowEdge> edges = List.of(
                new FlowEdge("e1", "query-1", "msg-found", "found"),
                new FlowEdge("e2", "query-1", "msg-empty", "not_found")
        );

        String nextNodeId = executor.execute(node, edges, currentUser, new Update(), telegramClient);
        assertThat(nextNodeId).isEqualTo("msg-empty");
    }

    @Test
    @DisplayName("Should query candidate with nested customFields and resolve placeholder variables from currentUser metadata")
    void execute_NestedCustomFieldsAndPlaceholders_Success() {
        Bot bot = Bot.builder().name("DatingBot").build();
        bot.setId(1L);
        BotUser currentUser = BotUser.builder()
                .bot(bot)
                .telegramId(100L)
                .firstName("Elijah")
                .metadata("{\"customFields\":{\"gender\":\"Чоловік\",\"city\":\"Фастів\",\"age\":\"18\"}}")
                .build();
        currentUser.setId(1L);

        BotUser candidateFemale = BotUser.builder()
                .bot(bot)
                .telegramId(200L)
                .firstName("Anna")
                .metadata("{\"customFields\":{\"gender\":\"Жінка\",\"city\":\"Фастів\",\"age\":\"19\"}}")
                .build();
        candidateFemale.setId(2L);

        lenient().when(interactionRepository.findInteractedTargetTelegramIds(eq(1L), eq(100L), any()))
                .thenReturn(List.of());
        when(botUserRepository.findAllByBotId(1L)).thenReturn(List.of(currentUser, candidateFemale));
        when(stateService.getSessionData(1L, 100L)).thenReturn(Map.of());

        FlowNode node = new FlowNode("query-1", NodeType.QUERY, Map.of(
                "outputPrefix", "found_user",
                "excludeSelf", true,
                "filters", List.of(
                        Map.of("field", "gender", "operator", "not_equals", "value", "gender"),
                        Map.of("field", "city", "operator", "equals", "value", "{city}")
                )
        ), pos);

        List<FlowEdge> edges = List.of(
                new FlowEdge("e1", "query-1", "msg-found", "found"),
                new FlowEdge("e2", "query-1", "msg-empty", "not_found")
        );

        String nextNodeId = executor.execute(node, edges, currentUser, new Update(), telegramClient);

        assertThat(nextNodeId).isEqualTo("msg-found");
        verify(stateService).setSessionData(1L, 100L, "found_user.telegram_id", "200");
        verify(stateService).setSessionData(1L, 100L, "found_user.gender", "Жінка");
        verify(stateService).setSessionData(1L, 100L, "found_user.city", "Фастів");
        verify(stateService).setSessionData(1L, 100L, "found_user.age", "19");
    }

    @Test
    @DisplayName("Should evaluate greater_than_or_equals and less_than_or_equals operators correctly")
    void execute_ComparisonOperators_Success() {
        Bot bot = Bot.builder().name("DatingBot").build();
        bot.setId(1L);
        BotUser currentUser = BotUser.builder()
                .bot(bot)
                .telegramId(100L)
                .metadata("{\"customFields\":{\"age\":\"20\"}}")
                .build();
        currentUser.setId(1L);

        BotUser candidate = BotUser.builder()
                .bot(bot)
                .telegramId(200L)
                .metadata("{\"customFields\":{\"age\":\"20\"}}")
                .build();
        candidate.setId(2L);

        when(botUserRepository.findAllByBotId(1L)).thenReturn(List.of(candidate));
        when(stateService.getSessionData(1L, 100L)).thenReturn(Map.of());

        FlowNode node = new FlowNode("query-gte", NodeType.QUERY, Map.of(
                "outputPrefix", "found_user",
                "excludeSelf", false,
                "filters", List.of(
                        Map.of("field", "age", "operator", "greater_than_or_equals", "value", "20"),
                        Map.of("field", "age", "operator", "less_than_or_equals", "value", "20")
                )
        ), pos);

        List<FlowEdge> edges = List.of(
                new FlowEdge("e1", "query-gte", "msg-found", "found"),
                new FlowEdge("e2", "query-gte", "msg-empty", "not_found")
        );

        String nextNodeId = executor.execute(node, edges, currentUser, new Update(), telegramClient);

        assertThat(nextNodeId).isEqualTo("msg-found");
    }
}
