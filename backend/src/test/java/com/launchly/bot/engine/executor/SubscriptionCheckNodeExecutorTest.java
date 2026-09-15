package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.engine.model.Position;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.service.BotDialogStateService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.telegram.telegrambots.meta.api.methods.groupadministration.GetChatMember;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.chatmember.ChatMember;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubscriptionCheckNodeExecutorTest {

    @Mock
    private BotDialogStateService stateService;

    @Mock
    private TelegramClient telegramClient;

    @InjectMocks
    private SubscriptionCheckNodeExecutor executor;

    private final Position pos = new Position(0.0, 0.0);
    private Bot bot;
    private BotUser botUser;

    @BeforeEach
    void setUp() {
        bot = Bot.builder().name("TestBot").build();
        bot.setId(1L);
        botUser = BotUser.builder().bot(bot).telegramId(12345L).firstName("TestUser").build();
    }

    @Test
    @DisplayName("Should return SUBSCRIPTION_CHECK type")
    void getType_Success() {
        assertThat(executor.getType()).isEqualTo(NodeType.SUBSCRIPTION_CHECK);
    }

    @Test
    @DisplayName("Should route to subscribed handle when user is a member of the required channel")
    void execute_SingleChannel_Subscribed() throws Exception {
        ChatMember chatMember = mock(ChatMember.class);
        when(chatMember.getStatus()).thenReturn("member");
        when(telegramClient.execute(any(GetChatMember.class))).thenReturn(chatMember);

        FlowNode node = new FlowNode("sub-1", NodeType.SUBSCRIPTION_CHECK, Map.of(
                "channels", List.of(Map.of("channelId", "@mychannel", "name", "Main Channel", "isRequired", true)),
                "mode", "all"
        ), pos);

        List<FlowEdge> edges = List.of(
                new FlowEdge("e1", "sub-1", "node-success", "subscribed"),
                new FlowEdge("e2", "sub-1", "node-fail", "not_subscribed")
        );

        String result = executor.execute(node, edges, botUser, new Update(), telegramClient);

        assertThat(result).isEqualTo("node-success");
        verify(stateService).setSessionData(1L, 12345L, "is_subscribed", "true");
        verify(stateService).setSessionData(1L, 12345L, "subscribed_channels_count", "1");
        verify(stateService).setSessionData(1L, 12345L, "total_channels_count", "1");
    }

    @Test
    @DisplayName("Should route to not_subscribed handle when user is left or kicked")
    void execute_SingleChannel_NotSubscribed() throws Exception {
        ChatMember chatMember = mock(ChatMember.class);
        when(chatMember.getStatus()).thenReturn("left");
        when(telegramClient.execute(any(GetChatMember.class))).thenReturn(chatMember);

        FlowNode node = new FlowNode("sub-1", NodeType.SUBSCRIPTION_CHECK, Map.of(
                "channels", List.of(Map.of("channelId", "@mychannel", "name", "Main Channel", "isRequired", true)),
                "mode", "all"
        ), pos);

        List<FlowEdge> edges = List.of(
                new FlowEdge("e1", "sub-1", "node-success", "subscribed"),
                new FlowEdge("e2", "sub-1", "node-fail", "not_subscribed")
        );

        String result = executor.execute(node, edges, botUser, new Update(), telegramClient);

        assertThat(result).isEqualTo("node-fail");
        verify(stateService).setSessionData(1L, 12345L, "is_subscribed", "false");
        verify(stateService).setSessionData(eq(1L), eq(12345L), eq("unsubscribed_channels"), eq("Main Channel"));
    }

    @Test
    @DisplayName("Should route to subscribed in mode 'any' if user is member in at least one channel")
    void execute_MultiChannel_ModeAny_Subscribed() throws Exception {
        ChatMember member = mock(ChatMember.class);
        when(member.getStatus()).thenReturn("member");

        when(telegramClient.execute(any(GetChatMember.class)))
                .thenThrow(new RuntimeException("Chat not found"))
                .thenReturn(member);

        FlowNode node = new FlowNode("sub-2", NodeType.SUBSCRIPTION_CHECK, Map.of(
                "channels", List.of(
                        Map.of("channelId", "@sponsor1", "name", "Sponsor 1", "isRequired", true),
                        Map.of("channelId", "@sponsor2", "name", "Sponsor 2", "isRequired", true)
                ),
                "mode", "any"
        ), pos);

        List<FlowEdge> edges = List.of(
                new FlowEdge("e1", "sub-2", "node-yes", "subscribed"),
                new FlowEdge("e2", "sub-2", "node-no", "not_subscribed")
        );

        String result = executor.execute(node, edges, botUser, new Update(), telegramClient);

        assertThat(result).isEqualTo("node-yes");
        verify(stateService).setSessionData(1L, 12345L, "is_subscribed", "true");
        verify(stateService).setSessionData(1L, 12345L, "subscribed_channels_count", "1");
        verify(stateService).setSessionData(1L, 12345L, "total_channels_count", "2");
    }
}
