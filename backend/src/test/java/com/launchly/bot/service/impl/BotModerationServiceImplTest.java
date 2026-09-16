package com.launchly.bot.service.impl;

import com.launchly.bot.dto.moderation.BotModerationRuleDto;
import com.launchly.bot.dto.moderation.TestModerationRequest;
import com.launchly.bot.dto.moderation.TestModerationResponse;
import com.launchly.bot.dto.moderation.UpdateBotModerationRuleRequest;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotModerationRule;
import com.launchly.bot.entity.FlowSchema;
import com.launchly.bot.entity.MediaMode;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.entity.ViolationAction;
import com.launchly.bot.repository.BotModerationRuleRepository;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.FlowSchemaRepository;
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
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BotModerationServiceImplTest {

    @Mock
    private BotModerationRuleRepository ruleRepository;

    @Mock
    private BotRepository botRepository;

    @Mock
    private FlowSchemaRepository flowSchemaRepository;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private TelegramClient telegramClient;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private BotModerationServiceImpl moderationService;

    private Bot testBot;
    private BotModerationRule testRule;

    @BeforeEach
    void setUp() {
        lenient().when(messageUtils.getMessageWithDefault(anyString(), anyString(), any())).thenAnswer(inv -> inv.getArgument(1));
        lenient().when(messageUtils.getMessageWithDefault(anyString(), anyString())).thenAnswer(inv -> inv.getArgument(1));
        lenient().when(messageUtils.getMessage(anyString())).thenAnswer(inv -> inv.getArgument(0));

        testBot = Bot.builder().name("TestBot").build();
        testBot.setId(1L);
        testRule = BotModerationRule.builder()
                .bot(testBot)
                .chatId("*")
                .enabled(true)
                .antiForwardEnabled(true)
                .antiLinkEnabled(true)
                .allowedLinks("launchly.app, github.com")
                .stopWords("badword, forbidden")
                .defaultProfanityFilter(true)
                .mediaMode(MediaMode.ALL)
                .actionOnViolation(ViolationAction.DELETE_AND_WARN)
                .warnTtlSeconds(5)
                .warningTemplate("Warning: {user}!")
                .build();
        testRule.setId(100L);
    }

    @Test
    @DisplayName("Should get moderation settings or return default when none exist")
    void shouldGetModerationSettings() {
        when(ruleRepository.findByBotIdAndChatId(1L, "*")).thenReturn(Optional.of(testRule));

        BotModerationRuleDto result = moderationService.getModerationSettings(1L);

        assertThat(result).isNotNull();
        assertThat(result.getBotId()).isEqualTo(1L);
        assertThat(result.isEnabled()).isTrue();
        assertThat(result.isAntiForwardEnabled()).isTrue();
    }

    @Test
    @DisplayName("Should update moderation settings successfully")
    void shouldUpdateModerationSettings() {
        when(botRepository.findById(1L)).thenReturn(Optional.of(testBot));
        when(ruleRepository.findByBotIdAndChatId(1L, "*")).thenReturn(Optional.of(testRule));
        when(ruleRepository.save(any(BotModerationRule.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateBotModerationRuleRequest request = UpdateBotModerationRuleRequest.builder()
                .enabled(true)
                .antiForwardEnabled(false)
                .antiLinkEnabled(true)
                .allowedLinks("example.com")
                .stopWords("crypto, scam")
                .defaultProfanityFilter(false)
                .mediaMode(MediaMode.TEXT_ONLY)
                .actionOnViolation(ViolationAction.DELETE_ONLY)
                .warnTtlSeconds(10)
                .warningTemplate("Alert {user}")
                .build();

        BotModerationRuleDto updated = moderationService.updateModerationSettings(1L, request);

        assertThat(updated).isNotNull();
        assertThat(updated.isAntiForwardEnabled()).isFalse();
        assertThat(updated.getMediaMode()).isEqualTo(MediaMode.TEXT_ONLY);
        assertThat(updated.getActionOnViolation()).isEqualTo(ViolationAction.DELETE_ONLY);
    }

    @Test
    @DisplayName("Should detect stop words in test moderation")
    void shouldDetectStopWordsInTest() {
        when(ruleRepository.findByBotIdAndChatId(1L, "*")).thenReturn(Optional.of(testRule));

        TestModerationRequest request = TestModerationRequest.builder()
                .text("This contains badword in text")
                .forwarded(false)
                .hasMedia(false)
                .build();

        TestModerationResponse response = moderationService.testModeration(1L, request);

        assertThat(response.isViolated()).isTrue();
        assertThat(response.getMatchedStopWord()).isEqualTo("badword");
        assertThat(response.getReasons()).anyMatch(r -> r.contains("badword"));
    }

    @Test
    @DisplayName("Should detect forbidden link in test moderation")
    void shouldDetectForbiddenLinkInTest() {
        when(ruleRepository.findByBotIdAndChatId(1L, "*")).thenReturn(Optional.of(testRule));

        TestModerationRequest request = TestModerationRequest.builder()
                .text("Visit https://spam-site.com now")
                .forwarded(false)
                .hasMedia(false)
                .build();

        TestModerationResponse response = moderationService.testModeration(1L, request);

        assertThat(response.isViolated()).isTrue();
        assertThat(response.getReasons()).anyMatch(r -> r.contains("Anti-Link"));
    }

    @Test
    @DisplayName("Should allow whitelisted link in test moderation")
    void shouldAllowWhitelistedLinkInTest() {
        when(ruleRepository.findByBotIdAndChatId(1L, "*")).thenReturn(Optional.of(testRule));

        TestModerationRequest request = TestModerationRequest.builder()
                .text("Check out https://github.com/launchly")
                .forwarded(false)
                .hasMedia(false)
                .build();

        TestModerationResponse response = moderationService.testModeration(1L, request);

        assertThat(response.isViolated()).isFalse();
    }

    @Test
    @DisplayName("Should intercept and moderate message containing stop word")
    void shouldInterceptAndModerateMessage() throws Exception {
        when(ruleRepository.findAllByBotIdAndEnabledTrue(1L)).thenReturn(List.of(testRule));

        Update update = mock(Update.class);
        Message message = mock(Message.class);
        User user = mock(User.class);

        when(update.hasMessage()).thenReturn(true);
        when(update.getMessage()).thenReturn(message);
        when(message.getChatId()).thenReturn(123456L);
        when(message.getMessageId()).thenReturn(999);
        when(message.getFrom()).thenReturn(user);
        when(message.hasText()).thenReturn(true);
        when(message.getText()).thenReturn("Check out this badword here");

        boolean intercepted = moderationService.processUpdateModeration(1L, update, telegramClient);

        assertThat(intercepted).isTrue();
        verify(telegramClient, atLeastOnce()).execute(any(DeleteMessage.class));
    }

    @Test
    @DisplayName("Should return false when FlowSchema MODERATION node is disabled")
    void shouldNotModerateWhenFlowSchemaModerationNodeIsDisabled() throws Exception {
        FlowSchema schema = new FlowSchema();
        schema.setNodes("[{\"id\":\"mod_1\",\"type\":\"MODERATION\",\"data\":{\"isEnabled\":false,\"stopWords\":[\"badword\"]}}]");

        when(flowSchemaRepository.findByBotId(1L)).thenReturn(Optional.of(schema));
        FlowNode flowNode = new FlowNode(
                "mod_1",
                NodeType.MODERATION,
                Map.of("isEnabled", false, "stopWords", List.of("badword")),
                null
        );
        when(objectMapper.readValue(eq(schema.getNodes()), any(TypeReference.class)))
                .thenReturn(List.of(flowNode));

        Update update = mock(Update.class);
        Message message = mock(Message.class);
        when(update.hasMessage()).thenReturn(true);
        when(update.getMessage()).thenReturn(message);
        when(message.getChatId()).thenReturn(123456L);

        boolean intercepted = moderationService.processUpdateModeration(1L, update, telegramClient);

        assertThat(intercepted).isFalse();
        verifyNoInteractions(telegramClient);
    }

    @Test
    @DisplayName("Should trigger captcha challenge when new member joins and captcha is enabled")
    void shouldTriggerCaptchaForNewChatMembers() throws Exception {
        testRule.setCaptchaEnabled(true);
        testRule.setCaptchaMode(com.launchly.bot.entity.CaptchaMode.BUTTON);
        testRule.setCaptchaTimeoutSeconds(60);
        when(ruleRepository.findAllByBotIdAndEnabledTrue(1L)).thenReturn(List.of(testRule));

        Update update = mock(Update.class);
        Message message = mock(Message.class);
        User newMember = mock(User.class);
        when(newMember.getId()).thenReturn(555L);
        when(newMember.getFirstName()).thenReturn("NewUser");
        when(newMember.getIsBot()).thenReturn(false);

        when(update.hasMessage()).thenReturn(true);
        when(update.getMessage()).thenReturn(message);
        when(message.getChatId()).thenReturn(123456L);
        when(message.getNewChatMembers()).thenReturn(List.of(newMember));

        Message challengeMsg = mock(Message.class);
        when(challengeMsg.getMessageId()).thenReturn(777);
        doReturn(null).when(telegramClient).execute(any(org.telegram.telegrambots.meta.api.methods.groupadministration.RestrictChatMember.class));
        doReturn(challengeMsg).when(telegramClient).execute(any(org.telegram.telegrambots.meta.api.methods.send.SendMessage.class));

        boolean intercepted = moderationService.processUpdateModeration(1L, update, telegramClient);

        assertThat(intercepted).isTrue();
        verify(telegramClient).execute(any(org.telegram.telegrambots.meta.api.methods.groupadministration.RestrictChatMember.class));
        verify(telegramClient).execute(any(org.telegram.telegrambots.meta.api.methods.send.SendMessage.class));
    }

    @Test
    @DisplayName("Should approve captcha callback from target user and unmute")
    void shouldApproveCaptchaCallback() throws Exception {
        Update update = mock(Update.class);
        org.telegram.telegrambots.meta.api.objects.CallbackQuery cb = mock(org.telegram.telegrambots.meta.api.objects.CallbackQuery.class);
        User user = mock(User.class);
        Message origMsg = mock(Message.class);

        when(update.hasCallbackQuery()).thenReturn(true);
        when(update.getCallbackQuery()).thenReturn(cb);
        when(cb.getData()).thenReturn("mod_captcha:btn:555");
        when(cb.getFrom()).thenReturn(user);
        when(cb.getId()).thenReturn("cb_123");
        when(user.getId()).thenReturn(555L);
        when(cb.getMessage()).thenReturn(origMsg);
        when(origMsg.getChatId()).thenReturn(123456L);
        when(origMsg.getMessageId()).thenReturn(777);

        boolean intercepted = moderationService.processUpdateModeration(1L, update, telegramClient);

        assertThat(intercepted).isTrue();
        verify(telegramClient).execute(any(org.telegram.telegrambots.meta.api.methods.groupadministration.RestrictChatMember.class));
        verify(telegramClient).execute(any(org.telegram.telegrambots.meta.api.methods.updatingmessages.DeleteMessage.class));
        verify(telegramClient).execute(any(org.telegram.telegrambots.meta.api.methods.AnswerCallbackQuery.class));
    }

    @Test
    @DisplayName("Should reject captcha callback from different user with alert")
    void shouldRejectCaptchaFromNonTargetUser() throws Exception {
        Update update = mock(Update.class);
        org.telegram.telegrambots.meta.api.objects.CallbackQuery cb = mock(org.telegram.telegrambots.meta.api.objects.CallbackQuery.class);
        User otherUser = mock(User.class);

        when(update.hasCallbackQuery()).thenReturn(true);
        when(update.getCallbackQuery()).thenReturn(cb);
        when(cb.getData()).thenReturn("mod_captcha:btn:555");
        when(cb.getFrom()).thenReturn(otherUser);
        when(otherUser.getId()).thenReturn(999L); // Different from 555
        when(cb.getId()).thenReturn("cb_123");

        boolean intercepted = moderationService.processUpdateModeration(1L, update, telegramClient);

        assertThat(intercepted).isTrue();
        verify(telegramClient).execute(any(org.telegram.telegrambots.meta.api.methods.AnswerCallbackQuery.class));
        verify(telegramClient, never()).execute(any(org.telegram.telegrambots.meta.api.methods.groupadministration.RestrictChatMember.class));
    }
}
