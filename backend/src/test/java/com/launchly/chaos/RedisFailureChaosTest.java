package com.launchly.chaos;

import com.launchly.bot.engine.callstack.BotCallStackManager;
import com.launchly.bot.engine.callstack.CallStackFrame;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.ListOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import tools.jackson.databind.ObjectMapper;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedisFailureChaosTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ListOperations<String, String> listOperations;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("Chaos: Redis connection drop during callstack push should be logged and not crash")
    void pushCallStack_RedisConnectionDrop_HandledGracefully() {
        when(redisTemplate.opsForList()).thenReturn(listOperations);
        doThrow(new RedisConnectionFailureException("Simulated Chaos: Redis cluster unreachable (Connection refused)"))
                .when(listOperations).rightPush(anyString(), anyString());

        BotCallStackManager callStackManager = new BotCallStackManager(redisTemplate, objectMapper);
        CallStackFrame frame = new CallStackFrame(10L, "node-return", 123456L);
        assertThatCode(() -> callStackManager.push(10L, 123456L, frame))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Chaos: Redis outage during callstack pop should fallback to null and not crash")
    void popCallStack_RedisOutage_HandledSafely() {
        when(redisTemplate.opsForList()).thenReturn(listOperations);
        when(listOperations.rightPop(anyString()))
                .thenThrow(new RedisConnectionFailureException("Simulated Chaos: Redis network partition"));

        BotCallStackManager callStackManager = new BotCallStackManager(redisTemplate, objectMapper);
        CallStackFrame frame = callStackManager.pop(10L, 123456L);
        assertThat(frame).isNull();
    }

    @Test
    @DisplayName("Chaos: Redis outage during getExecutingBotId should fallback to originalBotId")
    void getExecutingBotId_RedisOutage_FallbackToOriginalBotId() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString()))
                .thenThrow(new RedisConnectionFailureException("Simulated Chaos: Redis cluster timeout"));
        BotCallStackManager callStackManager = new BotCallStackManager(redisTemplate, objectMapper);
        Long executingBotId = callStackManager.getExecutingBotId(10L, 123456L);
        assertThat(executingBotId).isEqualTo(10L);
    }
}
