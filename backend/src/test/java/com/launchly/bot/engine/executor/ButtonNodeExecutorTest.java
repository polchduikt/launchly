package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.engine.model.Position;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.CallbackQuery;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ButtonNodeExecutorTest {

    @Mock
    private TelegramClient telegramClient;

    private final ButtonNodeExecutor executor = new ButtonNodeExecutor();
    private final Position pos = new Position(0.0, 0.0);

    @Test
    @DisplayName("Should return BUTTON type")
    void getType_Success() {
        assertThat(executor.getType()).isEqualTo(NodeType.BUTTON);
    }

    @Test
    @DisplayName("Should send inline keyboard message when executing button node without callback")
    void execute_SendButtons_Success() throws Exception {
        Bot bot = Bot.builder().name("TestBot").build();
        bot.setId(1L);
        BotUser botUser = BotUser.builder().bot(bot).telegramId(123456L).build();

        List<Map<String, String>> buttons = List.of(
                Map.of("label", "Pricing", "value", "btn_pricing", "row", "1"),
                Map.of("label", "Support", "value", "btn_support", "row", "1"),
                Map.of("label", "About Us", "value", "btn_about")
        );

        FlowNode node = new FlowNode("btn-node-1", NodeType.BUTTON, Map.of(
                "text", "Please select an option:",
                "buttons", buttons
        ), pos);

        String nextNode = executor.execute(node, List.of(), botUser, new Update(), telegramClient);

        assertThat(nextNode).isNull();
        verify(telegramClient).execute(any(SendMessage.class));
    }

    @Test
    @DisplayName("Should resolve target edge when update has matching callbackQuery data")
    void execute_WithCallbackQuery_ResolvesTargetNode() {
        Bot bot = Bot.builder().name("TestBot").build();
        bot.setId(1L);
        BotUser botUser = BotUser.builder().bot(bot).telegramId(123456L).build();

        Update update = new Update();
        CallbackQuery callbackQuery = new CallbackQuery();
        callbackQuery.setData("btn_pricing");
        update.setCallbackQuery(callbackQuery);

        FlowNode node = new FlowNode("btn-node-1", NodeType.BUTTON, Map.of(), pos);
        List<FlowEdge> edges = List.of(
                new FlowEdge("e1", "btn-node-1", "pricing-node", "btn_pricing"),
                new FlowEdge("e2", "btn-node-1", "support-node", "btn_support")
        );

        String nextNode = executor.execute(node, edges, botUser, update, telegramClient);
        assertThat(nextNode).isEqualTo("pricing-node");
    }
}
