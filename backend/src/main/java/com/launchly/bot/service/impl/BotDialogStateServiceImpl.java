package com.launchly.bot.service.impl;

import com.launchly.bot.service.BotDialogStateService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BotDialogStateServiceImpl implements BotDialogStateService {

    private static final Duration TTL = Duration.ofHours(24);
    private static final String STATE_PREFIX = "launchly:bot:state:";
    private static final String INPUT_PREFIX = "launchly:bot:input:";
    private static final String DATA_PREFIX = "launchly:bot:data:";

    private final StringRedisTemplate redisTemplate;

    @Override
    public void setCurrentNodeId(Long botId, Long telegramUserId, String nodeId) {
        String key = STATE_PREFIX + botId + ":" + telegramUserId;
        redisTemplate.opsForValue().set(key, nodeId, TTL);
    }

    @Override
    public Optional<String> getCurrentNodeId(Long botId, Long telegramUserId) {
        String key = STATE_PREFIX + botId + ":" + telegramUserId;
        return Optional.ofNullable(redisTemplate.opsForValue().get(key));
    }

    @Override
    public void setExpectedInput(Long botId, Long telegramUserId, String inputKey) {
        String key = INPUT_PREFIX + botId + ":" + telegramUserId;
        redisTemplate.opsForValue().set(key, inputKey, TTL);
    }

    @Override
    public Optional<String> getExpectedInput(Long botId, Long telegramUserId) {
        String key = INPUT_PREFIX + botId + ":" + telegramUserId;
        return Optional.ofNullable(redisTemplate.opsForValue().get(key));
    }

    @Override
    public void clearExpectedInput(Long botId, Long telegramUserId) {
        String key = INPUT_PREFIX + botId + ":" + telegramUserId;
        redisTemplate.delete(key);
    }

    @Override
    public void setSessionData(Long botId, Long telegramUserId, String field, String value) {
        String key = DATA_PREFIX + botId + ":" + telegramUserId;
        redisTemplate.opsForHash().put(key, field, value);
        redisTemplate.expire(key, TTL);
    }

    @Override
    public Map<String, String> getSessionData(Long botId, Long telegramUserId) {
        String key = DATA_PREFIX + botId + ":" + telegramUserId;
        Map<Object, Object> entries = redisTemplate.opsForHash().entries(key);
        Map<String, String> result = new HashMap<>();
        entries.forEach((k, v) -> result.put(k.toString(), v.toString()));
        return result;
    }

    @Override
    public void clearSession(Long botId, Long telegramUserId) {
        String stateKey = STATE_PREFIX + botId + ":" + telegramUserId;
        String inputKey = INPUT_PREFIX + botId + ":" + telegramUserId;
        String dataKey = DATA_PREFIX + botId + ":" + telegramUserId;
        redisTemplate.delete(stateKey);
        redisTemplate.delete(inputKey);
        redisTemplate.delete(dataKey);
    }
}
