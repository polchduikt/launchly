package com.launchly.bot.scheduler;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.engine.model.Position;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.FlowSchema;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.repository.FlowSchemaRepository;
import com.launchly.bot.service.FlowEngineService;
import com.launchly.broadcast.repository.BotUserTagRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FlowSchedulerServiceTest {

    @Mock
    private FlowSchemaRepository flowSchemaRepository;

    @Mock
    private BotUserRepository botUserRepository;

    @Mock
    private BotUserTagRepository botUserTagRepository;

    @Mock
    private FlowEngineService flowEngineService;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private FlowSchedulerService flowSchedulerService;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        flowSchedulerService = new FlowSchedulerService(
                flowSchemaRepository,
                botUserRepository,
                botUserTagRepository,
                flowEngineService,
                objectMapper,
                redisTemplate
        );
    }

    @Test
    @DisplayName("Should not process when no active schemas exist")
    void shouldSkipWhenNoActiveSchemas() {
        when(flowSchemaRepository.findAllByBotActiveTrue()).thenReturn(List.of());

        flowSchedulerService.processScheduledFlows();

        verifyNoInteractions(flowEngineService);
    }

    @Test
    @DisplayName("Should trigger scheduled daily flow when due")
    void shouldTriggerDailyFlow() throws Exception {
        Bot bot = Bot.builder().active(true).build();
        bot.setId(1L);
        BotUser botUser = BotUser.builder().bot(bot).build();
        botUser.setId(10L);

        ZonedDateTime nowKyiv = ZonedDateTime.now(ZoneId.of("Europe/Kyiv"));
        String currentTimeStr = nowKyiv.format(DateTimeFormatter.ofPattern("HH:mm"));

        FlowNode schedulerNode = new FlowNode(
                "sched-1",
                NodeType.SCHEDULER,
                Map.of(
                        "frequency", "daily",
                        "time", currentTimeStr,
                        "targetScope", "system",
                        "timezone", "Europe/Kyiv"
                ),
                new Position(0, 0)
        );

        FlowNode nextNode = new FlowNode(
                "action-1",
                NodeType.ACTION,
                Map.of(),
                new Position(100, 0)
        );

        FlowEdge edge = new FlowEdge("e1", "sched-1", "action-1", "next");

        FlowSchema schema = FlowSchema.builder()
                .bot(bot)
                .nodes(objectMapper.writeValueAsString(List.of(schedulerNode, nextNode)))
                .edges(objectMapper.writeValueAsString(List.of(edge)))
                .build();

        when(flowSchemaRepository.findAllByBotActiveTrue()).thenReturn(List.of(schema));
        when(valueOperations.get("flow:scheduler:last_run:1:sched-1:daily:" + currentTimeStr)).thenReturn(null);
        when(valueOperations.setIfAbsent(eq("lock:flow:scheduler:1:sched-1"), eq("1"), any(Duration.class))).thenReturn(true);
        when(botUserRepository.findAllByBotId(1L)).thenReturn(List.of(botUser));

        flowSchedulerService.processScheduledFlows();

        verify(flowEngineService).runFlow(eq(1L), eq(botUser), eq("action-1"), isNull());
    }
}
