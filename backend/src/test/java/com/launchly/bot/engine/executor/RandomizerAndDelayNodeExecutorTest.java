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
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RandomizerAndDelayNodeExecutorTest {

    @Mock
    private BotDialogStateService stateService;

    @Mock
    private TelegramClient telegramClient;

    private final Position pos = new Position(0.0, 0.0);

    @Test
    @DisplayName("RandomizerNodeExecutor should return RANDOMIZER type and pick from variations")
    void randomizerNodeExecutor_Success() {
        RandomizerNodeExecutor executor = new RandomizerNodeExecutor(stateService);
        assertThat(executor.getType()).isEqualTo(NodeType.RANDOMIZER);

        Bot bot = Bot.builder().name("TestBot").build();
        bot.setId(1L);
        BotUser botUser = BotUser.builder().bot(bot).telegramId(111L).build();

        when(stateService.getSessionData(1L, 111L)).thenReturn(Map.of());

        List<Map<String, Object>> variations = List.of(
                Map.of("name", "Variation A", "percentage", 100)
        );

        FlowNode node = new FlowNode("rand-1", NodeType.RANDOMIZER, Map.of("variations", variations), pos);
        List<FlowEdge> edges = List.of(
                new FlowEdge("e1", "rand-1", "flow-a", "variation_0")
        );

        String nextNode = executor.execute(node, edges, botUser, new Update(), telegramClient);

        assertThat(nextNode).isEqualTo("flow-a");
    }

    @Test
    @DisplayName("SmartDelayNodeExecutor should return SMART_DELAY type and set delay in session data")
    void smartDelayNodeExecutor_Success() {
        SmartDelayNodeExecutor executor = new SmartDelayNodeExecutor(stateService);
        assertThat(executor.getType()).isEqualTo(NodeType.SMART_DELAY);

        Bot bot = Bot.builder().name("TestBot").build();
        bot.setId(1L);
        BotUser botUser = BotUser.builder().bot(bot).telegramId(111L).build();

        when(stateService.getSessionData(1L, 111L)).thenReturn(Map.of());

        FlowNode node = new FlowNode("delay-1", NodeType.SMART_DELAY, Map.of(
                "waitAmount", 10,
                "waitUnit", "Minutes"
        ), pos);

        List<FlowEdge> edges = List.of(new FlowEdge("e1", "delay-1", "after-delay", null));

        String nextNode = executor.execute(node, edges, botUser, new Update(), telegramClient);

        assertThat(nextNode).isNull(); // Suspended flow execution
        verify(stateService).setSessionData(eq(1L), eq(111L), eq("delay_start_delay-1"), anyString());
    }
}
