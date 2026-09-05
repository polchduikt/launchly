package com.launchly.bot.engine.cache;

import com.launchly.bot.entity.FlowSchema;
import com.launchly.bot.repository.FlowSchemaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class FlowSchemaCache {

    private static final String SCHEMA_KEY = "launchly:bot:schema:%d";
    private static final Duration SCHEMA_TTL = Duration.ofMinutes(30);

    private final StringRedisTemplate redisTemplate;
    private final FlowSchemaRepository flowSchemaRepository;
    private final ObjectMapper objectMapper;

    private record CachedSchema(Long id, int version, String nodes, String edges) {}

    public FlowSchema getSchema(Long botId) {
        String key = String.format(SCHEMA_KEY, botId);
        String cached = redisTemplate.opsForValue().get(key);

        if (cached != null) {
            try {
                CachedSchema cachedSchema = objectMapper.readValue(cached, CachedSchema.class);
                FlowSchema schema = new FlowSchema();
                schema.setId(cachedSchema.id());
                schema.setVersion(cachedSchema.version());
                schema.setNodes(cachedSchema.nodes());
                schema.setEdges(cachedSchema.edges());
                return schema;
            } catch (Exception e) {
                log.error("Failed to deserialize cached schema for bot {}: {}", botId, e.getMessage(), e);
            }
        }

        Optional<FlowSchema> schemaOpt = flowSchemaRepository.findByBotId(botId);
        if (schemaOpt.isEmpty()) {
            return null;
        }

        FlowSchema schema = schemaOpt.get();
        try {
            CachedSchema cachedSchema = new CachedSchema(schema.getId(), schema.getVersion(), schema.getNodes(), schema.getEdges());
            redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(cachedSchema), SCHEMA_TTL);
        } catch (Exception e) {
            log.error("Failed to serialize schema for bot {}: {}", botId, e.getMessage(), e);
        }

        return schema;
    }

    public void evictSchema(Long botId) {
        String key = String.format(SCHEMA_KEY, botId);
        redisTemplate.delete(key);
    }
}
