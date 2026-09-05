package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.engine.model.Position;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.service.BotDialogStateService;
import com.launchly.broadcast.entity.Tag;
import com.launchly.broadcast.repository.BotUserTagRepository;
import com.launchly.broadcast.repository.TagRepository;
import com.launchly.integration.repository.IntegrationRepository;
import com.launchly.integration.service.GoogleSheetsService;
import com.launchly.integration.service.MailchimpService;
import com.launchly.notification.service.NotificationService;
import com.launchly.bot.engine.action.ActionContactManager;
import com.launchly.bot.engine.action.ActionPlaceholderResolver;
import com.launchly.bot.engine.action.handler.TagBotActionHandler;
import com.launchly.bot.engine.action.handler.UserFieldBotActionHandler;
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
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActionNodeExecutorTest {

    @Mock
    private BotDialogStateService stateService;

    @Mock
    private BotUserRepository botUserRepository;

    @Mock
    private TagRepository tagRepository;

    @Mock
    private BotUserTagRepository botUserTagRepository;

    @Mock
    private IntegrationRepository integrationRepository;

    @Mock
    private GoogleSheetsService googleSheetsService;

    @Mock
    private MailchimpService mailchimpService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private TelegramClient telegramClient;

    private ActionNodeExecutor executor;

    private final Position pos = new Position(0.0, 0.0);

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        ActionPlaceholderResolver placeholderResolver = new ActionPlaceholderResolver(tagRepository, botUserTagRepository, objectMapper);
        ActionContactManager contactManager = new ActionContactManager(botUserRepository, stateService, objectMapper);

        TagBotActionHandler tagHandler = new TagBotActionHandler(tagRepository, botUserTagRepository);
        UserFieldBotActionHandler userFieldHandler = new UserFieldBotActionHandler(stateService, placeholderResolver, contactManager);

        executor = new ActionNodeExecutor(stateService, List.of(tagHandler, userFieldHandler));
    }

    @Test
    @DisplayName("Should return ACTION type")
    void getType_Success() {
        assertThat(executor.getType()).isEqualTo(NodeType.ACTION);
    }

    @Test
    @DisplayName("Should execute ADD_TAG action and persist bot user tag")
    void execute_AddTag_Success() {
        Bot bot = Bot.builder().name("TestBot").build();
        bot.setId(1L);
        BotUser botUser = BotUser.builder().bot(bot).telegramId(100L).build();
        botUser.setId(5L);

        Tag tag = Tag.builder().name("VIP").bot(bot).build();
        tag.setId(20L);

        when(tagRepository.findByBotIdAndName(1L, "VIP")).thenReturn(Optional.of(tag));
        when(botUserTagRepository.existsByBotUserIdAndTagId(5L, 20L)).thenReturn(false);

        List<Map<String, Object>> actions = List.of(
                Map.of("type", "ADD_TAG", "tagName", "VIP")
        );

        FlowNode node = new FlowNode("act-1", NodeType.ACTION, Map.of("actions", actions), pos);
        List<FlowEdge> edges = List.of(new FlowEdge("e1", "act-1", "next-node", null));

        String nextNode = executor.execute(node, edges, botUser, new Update(), telegramClient);

        assertThat(nextNode).isEqualTo("next-node");
        verify(botUserTagRepository).save(any());
    }

    @Test
    @DisplayName("Should execute REMOVE_TAG action")
    void execute_RemoveTag_Success() {
        Bot bot = Bot.builder().name("TestBot").build();
        bot.setId(1L);
        BotUser botUser = BotUser.builder().bot(bot).telegramId(100L).build();
        botUser.setId(5L);

        Tag tag = Tag.builder().name("OLD_TAG").bot(bot).build();
        tag.setId(30L);

        when(tagRepository.findByBotIdAndName(1L, "OLD_TAG")).thenReturn(Optional.of(tag));

        List<Map<String, Object>> actions = List.of(
                Map.of("type", "REMOVE_TAG", "tagName", "OLD_TAG")
        );

        FlowNode node = new FlowNode("act-2", NodeType.ACTION, Map.of("actions", actions), pos);
        List<FlowEdge> edges = List.of(new FlowEdge("e2", "act-2", "after-remove", null));

        String nextNode = executor.execute(node, edges, botUser, new Update(), telegramClient);

        assertThat(nextNode).isEqualTo("after-remove");
        verify(botUserTagRepository).deleteByBotUserIdAndTagId(5L, 30L);
    }

    @Test
    @DisplayName("Should execute SET_USER_FIELD and CLEAR_USER_FIELD actions in session")
    void execute_SetAndClearUserField_Success() {
        Bot bot = Bot.builder().name("TestBot").build();
        bot.setId(1L);
        BotUser botUser = BotUser.builder().bot(bot).telegramId(100L).build();

        List<Map<String, Object>> actions = List.of(
                Map.of("type", "SET_USER_FIELD", "fieldName", "subscription_status", "fieldValue", "active"),
                Map.of("type", "CLEAR_USER_FIELD", "fieldName", "temp_code")
        );

        FlowNode node = new FlowNode("act-3", NodeType.ACTION, Map.of("actions", actions), pos);
        List<FlowEdge> edges = List.of(new FlowEdge("e3", "act-3", "target-step", null));

        String nextNode = executor.execute(node, edges, botUser, new Update(), telegramClient);

        assertThat(nextNode).isEqualTo("target-step");
        verify(stateService).setSessionData(1L, 100L, "subscription_status", "active");
        verify(stateService).setSessionData(1L, 100L, "temp_code", "");
    }
}
