package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.engine.model.Position;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.repository.BotUserInteractionRepository;
import com.launchly.bot.service.BotDialogStateService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InteractionNodeExecutorTest {

    @Mock
    private BotUserInteractionRepository interactionRepository;

    @Mock
    private BotDialogStateService stateService;

    @Mock
    private TelegramClient telegramClient;

    private InteractionNodeExecutor executor;
    private final Position pos = new Position(0.0, 0.0);

    @BeforeEach
    void setUp() {
        executor = new InteractionNodeExecutor(interactionRepository, stateService);
    }

    @Test
    @DisplayName("Should return INTERACTION type")
    void getType_Success() {
        assertThat(executor.getType()).isEqualTo(NodeType.INTERACTION);
    }

    @Test
    @DisplayName("Should save interaction and route to mutual edge when reverse like exists")
    void execute_MutualMatch_Success() {
        Bot bot = Bot.builder().name("DatingBot").build();
        bot.setId(1L);
        BotUser currentUser = BotUser.builder().bot(bot).telegramId(100L).firstName("Alex").build();

        when(stateService.getSessionData(1L, 100L)).thenReturn(Map.of("found_user.telegram_id", "200"));
        when(interactionRepository.findByBotIdAndSourceTelegramIdAndTargetTelegramIdAndInteractionType(1L, 100L, 200L, "like"))
                .thenReturn(Optional.empty());
        when(interactionRepository.existsByBotIdAndSourceTelegramIdAndTargetTelegramIdAndInteractionType(1L, 200L, 100L, "like"))
                .thenReturn(true);

        FlowNode node = new FlowNode("inter-1", NodeType.INTERACTION, Map.of(
                "targetUserId", "{found_user.telegram_id}",
                "interactionType", "like",
                "checkMutual", true,
                "mutualType", "like"
        ), pos);

        List<FlowEdge> edges = List.of(
                new FlowEdge("e1", "inter-1", "msg-mutual", "mutual"),
                new FlowEdge("e2", "inter-1", "query-next", "saved")
        );

        String nextNodeId = executor.execute(node, edges, currentUser, new Update(), telegramClient);

        assertThat(nextNodeId).isEqualTo("msg-mutual");
        verify(interactionRepository).save(any());
    }

    @Test
    @DisplayName("Should route to saved edge when not mutual")
    void execute_NonMutual_SavedHandle() {
        Bot bot = Bot.builder().name("DatingBot").build();
        bot.setId(1L);
        BotUser currentUser = BotUser.builder().bot(bot).telegramId(100L).firstName("Alex").build();

        when(stateService.getSessionData(1L, 100L)).thenReturn(Map.of("found_user.telegram_id", "200"));
        when(interactionRepository.findByBotIdAndSourceTelegramIdAndTargetTelegramIdAndInteractionType(1L, 100L, 200L, "like"))
                .thenReturn(Optional.empty());
        when(interactionRepository.existsByBotIdAndSourceTelegramIdAndTargetTelegramIdAndInteractionType(1L, 200L, 100L, "like"))
                .thenReturn(false);

        FlowNode node = new FlowNode("inter-1", NodeType.INTERACTION, Map.of(
                "targetUserId", "{found_user.telegram_id}",
                "interactionType", "like",
                "checkMutual", true,
                "mutualType", "like"
        ), pos);

        List<FlowEdge> edges = List.of(
                new FlowEdge("e1", "inter-1", "msg-mutual", "mutual"),
                new FlowEdge("e2", "inter-1", "query-next", "saved")
        );

        String nextNodeId = executor.execute(node, edges, currentUser, new Update(), telegramClient);

        assertThat(nextNodeId).isEqualTo("query-next");
        verify(interactionRepository).save(any());
    }
}
