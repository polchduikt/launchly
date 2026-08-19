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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class StartAndEndNodeExecutorTest {

    @Mock
    private BotDialogStateService stateService;

    @Mock
    private TelegramClient telegramClient;

    private final Position pos = new Position(0.0, 0.0);

    @Test
    @DisplayName("StartNodeExecutor should return START type and resolve target node from edges")
    void startNodeExecutor_Success() {
        StartNodeExecutor executor = new StartNodeExecutor();
        assertThat(executor.getType()).isEqualTo(NodeType.START);

        FlowNode node = new FlowNode("start-1", NodeType.START, Map.of(), pos);
        List<FlowEdge> edges = List.of(new FlowEdge("e1", "start-1", "msg-1", null));
        BotUser botUser = BotUser.builder().telegramId(111L).build();

        String nextNodeId = executor.execute(node, edges, botUser, new Update(), telegramClient);
        assertThat(nextNodeId).isEqualTo("msg-1");
    }

    @Test
    @DisplayName("StartBroadcastNodeExecutor should return START_BROADCAST type and resolve target node")
    void startBroadcastNodeExecutor_Success() {
        StartBroadcastNodeExecutor executor = new StartBroadcastNodeExecutor();
        assertThat(executor.getType()).isEqualTo(NodeType.START_BROADCAST);

        FlowNode node = new FlowNode("bcast-1", NodeType.START_BROADCAST, Map.of(), pos);
        List<FlowEdge> edges = List.of(new FlowEdge("e1", "bcast-1", "action-1", null));
        BotUser botUser = BotUser.builder().telegramId(111L).build();

        String nextNodeId = executor.execute(node, edges, botUser, new Update(), telegramClient);
        assertThat(nextNodeId).isEqualTo("action-1");
    }

    @Test
    @DisplayName("StartAutomationNodeExecutor should return START_AUTOMATION and resolve next handle edge")
    void startAutomationNodeExecutor_Success() {
        StartAutomationNodeExecutor executor = new StartAutomationNodeExecutor();
        assertThat(executor.getType()).isEqualTo(NodeType.START_AUTOMATION);

        FlowNode node = new FlowNode("auto-1", NodeType.START_AUTOMATION, Map.of(), pos);
        List<FlowEdge> edges = List.of(new FlowEdge("e1", "auto-1", "step-1", "next"));
        BotUser botUser = BotUser.builder().telegramId(111L).build();

        String nextNodeId = executor.execute(node, edges, botUser, new Update(), telegramClient);
        assertThat(nextNodeId).isEqualTo("step-1");
    }

    @Test
    @DisplayName("CommentNodeExecutor should return COMMENT type and return null")
    void commentNodeExecutor_Success() {
        CommentNodeExecutor executor = new CommentNodeExecutor();
        assertThat(executor.getType()).isEqualTo(NodeType.COMMENT);

        FlowNode node = new FlowNode("comment-1", NodeType.COMMENT, Map.of("text", "This is a note"), pos);
        String nextNodeId = executor.execute(node, List.of(), BotUser.builder().build(), new Update(), telegramClient);
        assertThat(nextNodeId).isNull();
    }

    @Test
    @DisplayName("EndNodeExecutor should send final message, clear user session, and return null")
    void endNodeExecutor_Success() throws Exception {
        EndNodeExecutor executor = new EndNodeExecutor(stateService);
        assertThat(executor.getType()).isEqualTo(NodeType.END);

        Bot bot = Bot.builder().name("TestBot").build();
        bot.setId(10L);
        BotUser botUser = BotUser.builder().bot(bot).telegramId(999L).build();

        FlowNode node = new FlowNode("end-1", NodeType.END, Map.of("text", "Thank you for chatting!"), pos);

        String nextNodeId = executor.execute(node, List.of(), botUser, new Update(), telegramClient);

        assertThat(nextNodeId).isNull();
        verify(telegramClient).execute(any(SendMessage.class));
        verify(stateService).clearSession(10L, 999L);
    }
}
