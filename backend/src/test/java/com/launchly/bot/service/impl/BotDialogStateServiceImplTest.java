package com.launchly.bot.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BotDialogStateServiceImplTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private BotDialogStateServiceImpl botDialogStateService;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    @DisplayName("Should set current node ID in Redis with TTL")
    void setCurrentNodeId_WhenValidNode_SetsInRedis() {
        botDialogStateService.setCurrentNodeId(1L, 100L, "node_123");

        verify(valueOperations, times(1)).set(
                eq("launchly:bot:state:1:100"),
                eq("node_123"),
                any(Duration.class)
        );
    }

    @Test
    @DisplayName("Should delete key when setting null or empty node ID")
    void setCurrentNodeId_WhenNullOrBlank_DeletesKey() {
        botDialogStateService.setCurrentNodeId(1L, 100L, null);
        verify(redisTemplate, times(1)).delete("launchly:bot:state:1:100");

        botDialogStateService.setCurrentNodeId(1L, 100L, "   ");
        verify(redisTemplate, times(2)).delete("launchly:bot:state:1:100");
    }

    @Test
    @DisplayName("Should retrieve current node ID from Redis")
    void getCurrentNodeId_WhenExists_ReturnsNodeId() {
        when(valueOperations.get("launchly:bot:state:1:100")).thenReturn("node_456");

        Optional<String> result = botDialogStateService.getCurrentNodeId(1L, 100L);

        assertThat(result).isPresent().contains("node_456");
    }

    @Test
    @DisplayName("Should return empty optional when node ID does not exist in Redis")
    void getCurrentNodeId_WhenNotFound_ReturnsEmpty() {
        when(valueOperations.get("launchly:bot:state:1:100")).thenReturn(null);

        Optional<String> result = botDialogStateService.getCurrentNodeId(1L, 100L);

        assertThat(result).isEmpty();
    }
}
