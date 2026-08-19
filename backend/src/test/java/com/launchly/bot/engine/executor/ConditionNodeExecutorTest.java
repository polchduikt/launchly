package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.engine.model.Position;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.service.BotDialogStateService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConditionNodeExecutorTest {

    @Mock
    private BotDialogStateService stateService;

    @Mock
    private TelegramClient telegramClient;

    @InjectMocks
    private ConditionNodeExecutor executor;

    private final Position pos = new Position(0.0, 0.0);

    @Test
    @DisplayName("Should return CONDITION type")
    void getType_Success() {
        assertThat(executor.getType()).isEqualTo(NodeType.CONDITION);
    }

    @Test
    @DisplayName("Should evaluate simple variable equality and follow true handle edge")
    void execute_SimpleVariableEquals_TrueHandle() {
        Bot bot = Bot.builder().name("TestBot").build();
        bot.setId(1L);
        BotUser botUser = BotUser.builder().bot(bot).telegramId(111L).firstName("John").build();

        when(stateService.getSessionData(1L, 111L)).thenReturn(Map.of("user_type", "VIP"));

        FlowNode node = new FlowNode("cond-1", NodeType.CONDITION, Map.of(
                "variable", "user_type",
                "operator", "equals",
                "value", "VIP"
        ), pos);

        List<FlowEdge> edges = List.of(
                new FlowEdge("e1", "cond-1", "vip-flow", "true"),
                new FlowEdge("e2", "cond-1", "regular-flow", "false")
        );

        String nextNode = executor.execute(node, edges, botUser, new Update(), telegramClient);
        assertThat(nextNode).isEqualTo("vip-flow");
    }

    @Test
    @DisplayName("Should evaluate simple variable inequality and follow false handle edge")
    void execute_SimpleVariableEquals_FalseHandle() {
        Bot bot = Bot.builder().name("TestBot").build();
        bot.setId(1L);
        BotUser botUser = BotUser.builder().bot(bot).telegramId(111L).firstName("John").build();

        when(stateService.getSessionData(1L, 111L)).thenReturn(Map.of("user_type", "Standard"));

        FlowNode node = new FlowNode("cond-1", NodeType.CONDITION, Map.of(
                "variable", "user_type",
                "operator", "equals",
                "value", "VIP"
        ), pos);

        List<FlowEdge> edges = List.of(
                new FlowEdge("e1", "cond-1", "vip-flow", "true"),
                new FlowEdge("e2", "cond-1", "regular-flow", "false")
        );

        String nextNode = executor.execute(node, edges, botUser, new Update(), telegramClient);
        assertThat(nextNode).isEqualTo("regular-flow");
    }

    @Test
    @DisplayName("Should evaluate multi-branch conditions and match branch_0")
    void execute_MultiBranch_MatchesFirstBranch() {
        Bot bot = Bot.builder().name("TestBot").build();
        bot.setId(1L);
        BotUser botUser = BotUser.builder().bot(bot).telegramId(111L).username("johndoe").build();

        when(stateService.getSessionData(1L, 111L)).thenReturn(Map.of("lang", "ua"));

        List<Map<String, Object>> branches = List.of(
                Map.of(
                        "matchType", "all",
                        "conditions", List.of(
                                Map.of("variable", "lang", "operator", "equals", "value", "ua")
                        )
                ),
                Map.of(
                        "matchType", "all",
                        "conditions", List.of(
                                Map.of("variable", "lang", "operator", "equals", "value", "en")
                        )
                )
        );

        FlowNode node = new FlowNode("cond-branch", NodeType.CONDITION, Map.of("branches", branches), pos);

        List<FlowEdge> edges = List.of(
                new FlowEdge("e1", "cond-branch", "ua-flow", "branch_0"),
                new FlowEdge("e2", "cond-branch", "en-flow", "branch_1"),
                new FlowEdge("e3", "cond-branch", "fallback-flow", "fallback")
        );

        String nextNode = executor.execute(node, edges, botUser, new Update(), telegramClient);
        assertThat(nextNode).isEqualTo("ua-flow");
    }

    @Test
    @DisplayName("Should evaluate condition operators: contains, begins_with, not_empty, empty")
    void execute_VariousOperators_Success() {
        Bot bot = Bot.builder().name("TestBot").build();
        bot.setId(1L);
        BotUser botUser = BotUser.builder().bot(bot).telegramId(111L).firstName("Alice").lastName("Smith").build();

        when(stateService.getSessionData(1L, 111L)).thenReturn(Map.of("email", "alice@example.com", "notes", ""));

        // Full name resolution
        FlowNode node1 = new FlowNode("c1", NodeType.CONDITION, Map.of("variable", "Full Name", "operator", "contains", "value", "Alice"), pos);
        List<FlowEdge> edges1 = List.of(new FlowEdge("e1", "c1", "target1", "true"));
        assertThat(executor.execute(node1, edges1, botUser, new Update(), telegramClient)).isEqualTo("target1");

        // Begins with operator
        FlowNode node2 = new FlowNode("c2", NodeType.CONDITION, Map.of("variable", "email", "operator", "begins_with", "value", "alice"), pos);
        List<FlowEdge> edges2 = List.of(new FlowEdge("e2", "c2", "target2", "true"));
        assertThat(executor.execute(node2, edges2, botUser, new Update(), telegramClient)).isEqualTo("target2");

        // Empty operator
        FlowNode node3 = new FlowNode("c3", NodeType.CONDITION, Map.of("variable", "notes", "operator", "empty"), pos);
        List<FlowEdge> edges3 = List.of(new FlowEdge("e3", "c3", "target3", "true"));
        assertThat(executor.execute(node3, edges3, botUser, new Update(), telegramClient)).isEqualTo("target3");
    }
}
