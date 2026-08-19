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
import org.springframework.data.redis.core.StringRedisTemplate;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.CallbackQuery;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessageNodeExecutorTest {

    @Mock
    private BotDialogStateService stateService;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private TelegramClient telegramClient;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Position pos = new Position(0.0, 0.0);

    @Test
    @DisplayName("Should return MESSAGE type")
    void getType_Success() {
        MessageNodeExecutor executor = new MessageNodeExecutor(stateService, redisTemplate, objectMapper);
        assertThat(executor.getType()).isEqualTo(NodeType.MESSAGE);
    }

    @Test
    @DisplayName("Should send text message with placeholders substituted and follow next edge")
    void execute_TextMessageWithPlaceholders_Success() throws Exception {
        MessageNodeExecutor executor = new MessageNodeExecutor(stateService, redisTemplate, objectMapper);

        Bot bot = Bot.builder().name("MessageBot").build();
        bot.setId(1L);
        BotUser botUser = BotUser.builder().bot(bot).telegramId(123456L).firstName("John").build();

        when(stateService.getSessionData(1L, 123456L)).thenReturn(Map.of("custom_var", "Special Offer"));

        List<Map<String, Object>> blocks = List.of(
                Map.of("type", "text", "text", "Hello {{First Name}}! Check our {{custom_var}}.")
        );

        FlowNode node = new FlowNode("msg-1", NodeType.MESSAGE, Map.of("blocks", blocks), pos);
        List<FlowEdge> edges = List.of(new FlowEdge("e1", "msg-1", "next-step", null));

        String nextNode = executor.execute(node, edges, botUser, new Update(), telegramClient);

        assertThat(nextNode).isEqualTo("next-step");
        verify(telegramClient).execute(any(SendMessage.class));
    }

    @Test
    @DisplayName("Should handle callback query matching node button value")
    void execute_WithCallbackQuery_RoutesToCorrectHandle() {
        MessageNodeExecutor executor = new MessageNodeExecutor(stateService, redisTemplate, objectMapper);

        Bot bot = Bot.builder().name("MessageBot").build();
        bot.setId(1L);
        BotUser botUser = BotUser.builder().bot(bot).telegramId(123456L).build();

        Update update = new Update();
        CallbackQuery callbackQuery = new CallbackQuery();
        callbackQuery.setData("btn_checkout");
        update.setCallbackQuery(callbackQuery);

        List<Map<String, Object>> blocks = List.of(
                Map.of(
                        "type", "text",
                        "text", "Would you like to buy?",
                        "buttons", List.of(Map.of("label", "Buy Now", "value", "btn_checkout"))
                )
        );

        FlowNode node = new FlowNode("msg-btn", NodeType.MESSAGE, Map.of("blocks", blocks), pos);
        List<FlowEdge> edges = List.of(
                new FlowEdge("e1", "msg-btn", "checkout-node", "btn_checkout")
        );

        String nextNode = executor.execute(node, edges, botUser, update, telegramClient);

        assertThat(nextNode).isEqualTo("checkout-node");
    }
}
