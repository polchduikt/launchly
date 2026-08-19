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
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.message.Message;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InputNodeExecutorTest {

    @Mock
    private BotDialogStateService stateService;

    @Mock
    private TelegramClient telegramClient;

    @InjectMocks
    private InputNodeExecutor executor;

    private final Position pos = new Position(0.0, 0.0);

    @Test
    @DisplayName("Should return INPUT type")
    void getType_Success() {
        assertThat(executor.getType()).isEqualTo(NodeType.INPUT);
    }

    @Test
    @DisplayName("Should prompt user for input and set expected input in dialog state")
    void execute_PromptUser_Success() throws Exception {
        Bot bot = Bot.builder().name("TestBot").build();
        bot.setId(1L);
        BotUser botUser = BotUser.builder().bot(bot).telegramId(100L).build();

        when(stateService.getExpectedInput(1L, 100L)).thenReturn(Optional.empty());

        FlowNode node = new FlowNode("inp-1", NodeType.INPUT, Map.of(
                "variableName", "user_email",
                "text", "Please provide your email address:"
        ), pos);

        String nextNode = executor.execute(node, List.of(), botUser, new Update(), telegramClient);

        assertThat(nextNode).isNull();
        verify(telegramClient).execute(any(SendMessage.class));
        verify(stateService).setExpectedInput(1L, 100L, "user_email");
    }

    @Test
    @DisplayName("Should capture user text response, save in session data, and follow edge")
    void execute_CaptureInput_Success() {
        Bot bot = Bot.builder().name("TestBot").build();
        bot.setId(1L);
        BotUser botUser = BotUser.builder().bot(bot).telegramId(100L).build();

        when(stateService.getExpectedInput(1L, 100L)).thenReturn(Optional.of("user_email"));

        Update update = new Update();
        Message message = new Message();
        message.setText("test@example.com");
        update.setMessage(message);

        FlowNode node = new FlowNode("inp-1", NodeType.INPUT, Map.of("variableName", "user_email"), pos);
        List<FlowEdge> edges = List.of(new FlowEdge("e1", "inp-1", "after-input", null));

        String nextNode = executor.execute(node, edges, botUser, update, telegramClient);

        assertThat(nextNode).isEqualTo("after-input");
        verify(stateService).setSessionData(1L, 100L, "user_email", "test@example.com");
        verify(stateService).clearExpectedInput(1L, 100L);
    }
}
