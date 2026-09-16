package com.launchly.bot.service.impl;

import com.launchly.bot.entity.BotUser;
import com.launchly.bot.service.BotDialogStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class BotDialogStateServiceImpl implements BotDialogStateService {

    private static final Duration TTL = Duration.ofHours(24);
    private static final String STATE_PREFIX = "launchly:bot:state:";
    private static final String INPUT_PREFIX = "launchly:bot:input:";
    private static final String DATA_PREFIX = "launchly:bot:data:";
    private static final String CAMPAIGN_PREFIX = "launchly:bot:campaign:";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public void setCurrentNodeId(Long botId, Long telegramUserId, String nodeId) {
        String key = STATE_PREFIX + botId + ":" + telegramUserId;
        if (nodeId == null || nodeId.trim().isEmpty()) {
            redisTemplate.delete(key);
        } else {
            redisTemplate.opsForValue().set(key, nodeId, TTL);
        }
    }

    @Override
    public Optional<String> getCurrentNodeId(Long botId, Long telegramUserId) {
        String key = STATE_PREFIX + botId + ":" + telegramUserId;
        String val = redisTemplate.opsForValue().get(key);
        if (val == null || val.trim().isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(val);
    }

    @Override
    public void setExpectedInput(Long botId, Long telegramUserId, String inputKey) {
        String key = INPUT_PREFIX + botId + ":" + telegramUserId;
        if (inputKey == null || inputKey.trim().isEmpty()) {
            redisTemplate.delete(key);
        } else {
            redisTemplate.opsForValue().set(key, inputKey, TTL);
        }
    }

    @Override
    public Optional<String> getExpectedInput(Long botId, Long telegramUserId) {
        String key = INPUT_PREFIX + botId + ":" + telegramUserId;
        String val = redisTemplate.opsForValue().get(key);
        if (val == null || val.trim().isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(val);
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
    public void setActiveCampaignId(Long botId, Long telegramUserId, Long campaignId) {
        String key = CAMPAIGN_PREFIX + botId + ":" + telegramUserId;
        redisTemplate.opsForValue().set(key, campaignId.toString(), TTL);
    }

    @Override
    public Optional<Long> getActiveCampaignId(Long botId, Long telegramUserId) {
        String key = CAMPAIGN_PREFIX + botId + ":" + telegramUserId;
        String val = redisTemplate.opsForValue().get(key);
        if (val == null) {
            return Optional.empty();
        }
        try {
            return Optional.of(Long.parseLong(val));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    @Override
    public void clearActiveCampaignId(Long botId, Long telegramUserId) {
        String key = CAMPAIGN_PREFIX + botId + ":" + telegramUserId;
        redisTemplate.delete(key);
    }

    @Override
    public void clearSession(Long botId, Long telegramUserId) {
        String stateKey = STATE_PREFIX + botId + ":" + telegramUserId;
        String inputKey = INPUT_PREFIX + botId + ":" + telegramUserId;
        String dataKey = DATA_PREFIX + botId + ":" + telegramUserId;
        String campaignKey = CAMPAIGN_PREFIX + botId + ":" + telegramUserId;
        redisTemplate.delete(stateKey);
        redisTemplate.delete(inputKey);
        redisTemplate.delete(dataKey);
        redisTemplate.delete(campaignKey);
    }

    @Override
    public boolean isAutomationPaused(BotUser botUser) {
        if (botUser == null) return false;
        String metadata = botUser.getMetadata();
        if (metadata == null || metadata.isBlank() || "{}".equals(metadata)) return false;
        try {
            Map<String, Object> meta = objectMapper.readValue(metadata, new TypeReference<Map<String, Object>>() {});
            if (meta != null && Boolean.TRUE.equals(meta.get("paused"))) {
                Object pausedUntilObj = meta.get("pausedUntil");
                if (pausedUntilObj instanceof Number) {
                    long pausedUntil = ((Number) pausedUntilObj).longValue();
                    if (System.currentTimeMillis() > pausedUntil) {
                        return false;
                    }
                } else if (pausedUntilObj instanceof String) {
                    try {
                        long pausedUntil = Long.parseLong((String) pausedUntilObj);
                        if (System.currentTimeMillis() > pausedUntil) {
                            return false;
                        }
                    } catch (NumberFormatException e) {
                        log.warn("Failed to parse pausedUntil timestamp: {}", pausedUntilObj);
                    }
                }
                return true;
            }
        } catch (Exception e) {
            log.warn("Failed to check if automation is paused for user {}: {}", botUser.getId(), e.getMessage());
        }
        return false;
    }
}
