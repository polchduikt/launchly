package com.launchly.common.ratelimit;

import io.github.bucket4j.ConsumptionProbe;
import java.time.Duration;

public interface RateLimitService {

    ConsumptionProbe tryConsume(String key, long capacity, Duration duration, long tokens);

    boolean isAllowed(String key, long capacity, Duration duration);

    void reset(String key);
}