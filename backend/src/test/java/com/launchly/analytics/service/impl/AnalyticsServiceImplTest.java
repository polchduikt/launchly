package com.launchly.analytics.service.impl;

import com.launchly.analytics.entity.AnalyticsEvent;
import com.launchly.analytics.entity.AnalyticsEventType;
import com.launchly.analytics.repository.AnalyticsEventRepository;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.repository.BotMemberRepository;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.repository.FlowSchemaRepository;
import com.launchly.broadcast.repository.BotUserTagRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.ObjectMapper;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceImplTest {

    @Mock
    private AnalyticsEventRepository analyticsEventRepository;

    @Mock
    private BotRepository botRepository;

    @Mock
    private BotUserRepository botUserRepository;

    @Mock
    private FlowSchemaRepository flowSchemaRepository;

    @Mock
    private BotMemberRepository botMemberRepository;

    @Mock
    private BotUserTagRepository botUserTagRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private AnalyticsServiceImpl analyticsService;

    private Bot testBot;
    private BotUser testBotUser;

    @BeforeEach
    void setUp() {
        testBot = Bot.builder().name("Stats Bot").build();
        ReflectionTestUtils.setField(testBot, "id", 10L);

        testBotUser = BotUser.builder().bot(testBot).telegramId(999L).build();
        ReflectionTestUtils.setField(testBotUser, "id", 100L);
    }

    @Test
    @DisplayName("Should successfully log analytics event when bot exists")
    void logEvent_WhenBotExists_SavesEvent() {
        when(botRepository.findById(10L)).thenReturn(Optional.of(testBot));

        analyticsService.logEvent(10L, testBotUser, AnalyticsEventType.CLICK, "btn_order");

        verify(analyticsEventRepository, times(1)).save(any(AnalyticsEvent.class));
    }

    @Test
    @DisplayName("Should skip logging event when bot does not exist")
    void logEvent_WhenBotNotFound_SkipsSaving() {
        when(botRepository.findById(99L)).thenReturn(Optional.empty());

        analyticsService.logEvent(99L, testBotUser, AnalyticsEventType.CLICK, "btn_order");

        verify(analyticsEventRepository, never()).save(any());
    }
}
