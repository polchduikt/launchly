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

    private static final Duration DEFAULT_TTL = Duration.ofMinutes(10);
    private static final Duration TTL_PLANS = Duration.ofHours(24);
    private static final Duration TTL_FLOW_SCHEMAS = Duration.ofHours(1);
    private static final Duration TTL_ADMIN_STATS = Duration.ofMinutes(5);
    private static final Duration TTL_SUBSCRIPTION = Duration.ofMinutes(30);
    private static final Duration TTL_BOTS = Duration.ofMinutes(10);
    private static final Duration TTL_TAGS = Duration.ofMinutes(10);
    private static final Duration TTL_BLOG_ARTICLES = Duration.ofHours(1);
    private static final Duration TTL_BLOG_ARTICLE = Duration.ofHours(2);
    private static final Duration TTL_TEMPLATES = Duration.ofHours(2);
    private static final Duration TTL_I18N = Duration.ofHours(24);

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration
                .defaultCacheConfig()
                .entryTtl(DEFAULT_TTL)
                .serializeKeysWith(
                    RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(
                    RedisSerializationContext.SerializationPair
                        .fromSerializer(GenericJacksonJsonRedisSerializer.builder().enableUnsafeDefaultTyping().build()));

        Map<String, RedisCacheConfiguration> configs = Map.ofEntries(
            Map.entry("plans",         defaultConfig.entryTtl(TTL_PLANS)),
            Map.entry("plan",          defaultConfig.entryTtl(TTL_PLANS)),
            Map.entry("flow_schemas",  defaultConfig.entryTtl(TTL_FLOW_SCHEMAS)),
            Map.entry("admin_stats",   defaultConfig.entryTtl(TTL_ADMIN_STATS)),
            Map.entry("subscription",  defaultConfig.entryTtl(TTL_SUBSCRIPTION)),
            Map.entry("bots",          defaultConfig.entryTtl(TTL_BOTS)),
            Map.entry("tags",          defaultConfig.entryTtl(TTL_TAGS)),
            Map.entry("blog_articles", defaultConfig.entryTtl(TTL_BLOG_ARTICLES)),
            Map.entry("blog_article",  defaultConfig.entryTtl(TTL_BLOG_ARTICLE)),
            Map.entry("templates",     defaultConfig.entryTtl(TTL_TEMPLATES)),
            Map.entry("i18n",          defaultConfig.entryTtl(TTL_I18N))
        );

        return RedisCacheManager.builder(factory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(configs)
                .build();
    }
}
