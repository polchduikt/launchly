package com.launchly.common.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJacksonJsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import java.time.Duration;
import java.util.Map;

@Configuration
@EnableCaching
@Profile("!test")
public class CacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration
                .defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .serializeKeysWith(
                    RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(
                    RedisSerializationContext.SerializationPair
                        .fromSerializer(GenericJacksonJsonRedisSerializer.builder().enableUnsafeDefaultTyping().build()));

        Map<String, RedisCacheConfiguration> configs = Map.ofEntries(
            Map.entry("users",         defaultConfig.entryTtl(Duration.ofMinutes(15))),
            Map.entry("plans",         defaultConfig.entryTtl(Duration.ofHours(24))),
            Map.entry("plan",          defaultConfig.entryTtl(Duration.ofHours(24))),
            Map.entry("flow_schemas",  defaultConfig.entryTtl(Duration.ofHours(1))),
            Map.entry("admin_stats",   defaultConfig.entryTtl(Duration.ofMinutes(5))),
            Map.entry("subscription",  defaultConfig.entryTtl(Duration.ofMinutes(30))),
            Map.entry("bots",          defaultConfig.entryTtl(Duration.ofMinutes(10))),
            Map.entry("tags",          defaultConfig.entryTtl(Duration.ofMinutes(10))),
            Map.entry("blog_articles", defaultConfig.entryTtl(Duration.ofHours(1))),
            Map.entry("blog_article",  defaultConfig.entryTtl(Duration.ofHours(2)))
        );

        return RedisCacheManager.builder(factory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(configs)
                .build();
    }
}
