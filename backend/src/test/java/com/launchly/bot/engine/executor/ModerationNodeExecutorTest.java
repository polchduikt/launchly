package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.engine.model.Position;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.service.BotDialogStateService;
import com.launchly.common.utils.MessageUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.telegram.telegrambots.meta.api.methods.updatingmessages.DeleteMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.User;
import org.telegram.telegrambots.meta.api.objects.message.Message;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ScheduledExecutorService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ModerationNodeExecutorTest {

    @Mock
    private BotDialogStateService stateService;

    @Mock
    private TelegramClient telegramClient;

    @Mock
    private MessageUtils messageUtils;

    @Mock
    private ScheduledExecutorService scheduledExecutor;

    @InjectMocks
    private ModerationNodeExecutor executor;

    private Bot testBot;
    private BotUser testUser;
    private FlowNode node;
    private List<FlowEdge> edges;

    @BeforeEach
    void setUp() {
        testBot = Bot.builder().name("TestBot").build();
        testBot.setId(1L);
        testUser = BotUser.builder().bot(testBot).telegramId(12345L).build();
        testUser.setId(10L);

        node = new FlowNode("node_mod", NodeType.MODERATION, Map.of(
                "antiForwardEnabled", true,
                "antiLinkEnabled", true,
                "stopWords", "forbidden, scam",
                "defaultProfanityFilter", true,
                "mediaMode", "ALL",
                "actionOnViolation", "DELETE_AND_WARN"
        ), new Position(0.0, 0.0));

        edges = List.of(
                new FlowEdge("e1", "node_mod", "node_clean", "clean"),
                new FlowEdge("e2", "node_mod", "node_violated", "violated")
        );
    }

    @Test
    @DisplayName("Should return NodeType.MODERATION")
    void shouldReturnCorrectType() {
        assertThat(executor.getType()).isEqualTo(NodeType.MODERATION);
    }

    @Test
    @DisplayName("Should pass clean message to clean handle")
    void shouldPassCleanMessage() {
        Update update = mock(Update.class);
        Message message = mock(Message.class);
        when(update.hasMessage()).thenReturn(true);
        when(update.getMessage()).thenReturn(message);
        when(message.hasText()).thenReturn(true);
        when(message.getText()).thenReturn("Hello world, clean message!");

        String next = executor.execute(node, edges, testUser, update, telegramClient);

        assertThat(next).isEqualTo("node_clean");
        verify(stateService).setSessionData(1L, 12345L, "is_moderation_passed", "true");
        verifyNoInteractions(telegramClient);
    }

    @Test
    @DisplayName("Should block message with stop-word and route to violated handle")
    void shouldBlockStopWord() throws Exception {
        Update update = mock(Update.class);
        Message message = mock(Message.class);
        User user = mock(User.class);
        when(update.hasMessage()).thenReturn(true);
        when(update.getMessage()).thenReturn(message);
        when(message.hasText()).thenReturn(true);
        when(message.getText()).thenReturn("Check out this forbidden deal");
        when(message.getChatId()).thenReturn(999L);
        when(message.getMessageId()).thenReturn(101);
        when(message.getFrom()).thenReturn(user);

        String next = executor.execute(node, edges, testUser, update, telegramClient);

        assertThat(next).isEqualTo("node_violated");
        verify(stateService).setSessionData(1L, 12345L, "is_moderation_passed", "false");
        verify(telegramClient, atLeastOnce()).execute(any(DeleteMessage.class));
    }
}