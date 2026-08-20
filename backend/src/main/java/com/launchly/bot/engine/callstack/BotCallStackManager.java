package com.launchly.bot.engine.callstack;

import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor
public class BotCallStackManager {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String CALLSTACK_KEY_PREFIX = "launchly:bot:callstack:";
    private static final String EXECUTING_BOT_KEY_PREFIX = "launchly:bot:executing_bot:";
    private static final Duration TTL = Duration.ofHours(24);

    public void push(Long originalBotId, Long telegramUserId, CallStackFrame frame) {
        try {
            String key = CALLSTACK_KEY_PREFIX + originalBotId + ":" + telegramUserId;
            String json = objectMapper.writeValueAsString(frame);
            redisTemplate.opsForList().rightPush(key, json);
            redisTemplate.expire(key, TTL);
        } catch (Exception e) {
            log.error("Failed to push to call stack for bot {} user {}: {}", originalBotId, telegramUserId, e.getMessage(), e);
        }
    }

    public CallStackFrame pop(Long originalBotId, Long telegramUserId) {
        try {
            String key = CALLSTACK_KEY_PREFIX + originalBotId + ":" + telegramUserId;
            String json = redisTemplate.opsForList().rightPop(key);
            if (json == null || json.trim().isEmpty()) {
                return null;
            }
            return objectMapper.readValue(json, CallStackFrame.class);
        } catch (Exception e) {
            log.error("Failed to pop from call stack for bot {} user {}: {}", originalBotId, telegramUserId, e.getMessage(), e);
            return null;
        }
    }

    public void clear(Long originalBotId, Long telegramUserId) {
        try {
            String key = CALLSTACK_KEY_PREFIX + originalBotId + ":" + telegramUserId;
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.error("Failed to clear call stack for bot {} user {}: {}", originalBotId, telegramUserId, e.getMessage(), e);
        }
    }

    public Long getExecutingBotId(Long originalBotId, Long telegramUserId) {
        try {
            String key = EXECUTING_BOT_KEY_PREFIX + originalBotId + ":" + telegramUserId;
            String val = redisTemplate.opsForValue().get(key);
            if (val == null || val.trim().isEmpty()) {
                return originalBotId;
            }
            return Long.parseLong(val);
        } catch (Exception e) {
            log.error("Failed to get executing bot id for bot {} user {}: {}", originalBotId, telegramUserId, e.getMessage(), e);
            return originalBotId;
        }
    }

    public void setExecutingBotId(Long originalBotId, Long telegramUserId, Long executingBotId) {
        try {
            String key = EXECUTING_BOT_KEY_PREFIX + originalBotId + ":" + telegramUserId;
            if (executingBotId == null || executingBotId.equals(originalBotId)) {
                redisTemplate.delete(key);
            } else {
                redisTemplate.opsForValue().set(key, executingBotId.toString(), TTL);
            }
        } catch (Exception e) {
            log.error("Failed to set executing bot id for bot {} user {}: {}", originalBotId, telegramUserId, e.getMessage(), e);
        }
    }
}
