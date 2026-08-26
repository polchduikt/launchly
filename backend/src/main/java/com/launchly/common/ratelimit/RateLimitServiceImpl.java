package com.launchly.common.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

@Slf4j
@Service
public class RateLimitServiceImpl implements RateLimitService {

    private final ProxyManager<byte[]> proxyManager;
    private final Map<String, Bucket> localBuckets = new ConcurrentHashMap<>();

    public RateLimitServiceImpl(@Autowired(required = false) ProxyManager<byte[]> proxyManager) {
        this.proxyManager = proxyManager;
    }

    @Override
    public ConsumptionProbe tryConsume(String key, long capacity, Duration duration, long tokens) {
        Supplier<BucketConfiguration> configurationSupplier = () -> {
            Bandwidth limit = Bandwidth.builder()
                    .capacity(capacity)
                    .refillGreedy(capacity, duration)
                    .build();
            return BucketConfiguration.builder()
                    .addLimit(limit)
                    .build();
        };

        if (proxyManager != null) {
            try {
                byte[] keyBytes = key.getBytes(StandardCharsets.UTF_8);
                Bucket bucket = proxyManager.builder().build(keyBytes, configurationSupplier);
                return bucket.tryConsumeAndReturnRemaining(tokens);
            } catch (Exception e) {
                log.warn("Failed to use distributed rate limiter for key {}, falling back to in-memory: {}", key, e.getMessage());
            }
        }

        Bucket localBucket = localBuckets.computeIfAbsent(key, k -> {
            Bandwidth limit = Bandwidth.builder()
                    .capacity(capacity)
                    .refillGreedy(capacity, duration)
                    .build();
            return Bucket.builder()
                    .addLimit(limit)
                    .build();
        });

        return localBucket.tryConsumeAndReturnRemaining(tokens);
    }

    @Override
    public boolean isAllowed(String key, long capacity, Duration duration) {
        ConsumptionProbe probe = tryConsume(key, capacity, duration, 1);
        return probe.isConsumed();
    }

    @Override
    public void reset(String key) {
        localBuckets.remove(key);
    }
}