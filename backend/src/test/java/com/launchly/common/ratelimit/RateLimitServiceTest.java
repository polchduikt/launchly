package com.launchly.common.ratelimit;

import io.github.bucket4j.ConsumptionProbe;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitServiceTest {

    private RateLimitServiceImpl rateLimitService;

    @BeforeEach
    void setUp() {
        rateLimitService = new RateLimitServiceImpl(null);
    }

    @Test
    void tryConsume_withinLimit_shouldAllow() {
        String key = "test-key-1";
        ConsumptionProbe probe = rateLimitService.tryConsume(key, 5, Duration.ofMinutes(1), 1);

        assertThat(probe.isConsumed()).isTrue();
        assertThat(probe.getRemainingTokens()).isEqualTo(4);
    }

    @Test
    void tryConsume_exceedingLimit_shouldReject() {
        String key = "test-key-2";
        for (int i = 0; i < 3; i++) {
            rateLimitService.tryConsume(key, 3, Duration.ofMinutes(1), 1);
        }

        ConsumptionProbe probe = rateLimitService.tryConsume(key, 3, Duration.ofMinutes(1), 1);
        assertThat(probe.isConsumed()).isFalse();
        assertThat(probe.getRemainingTokens()).isEqualTo(0);
        assertThat(probe.getNanosToWaitForRefill()).isGreaterThan(0);
    }

    @Test
    void isAllowed_shouldReturnCorrectBoolean() {
        String key = "test-key-3";
        assertThat(rateLimitService.isAllowed(key, 2, Duration.ofMinutes(1))).isTrue();
        assertThat(rateLimitService.isAllowed(key, 2, Duration.ofMinutes(1))).isTrue();
        assertThat(rateLimitService.isAllowed(key, 2, Duration.ofMinutes(1))).isFalse();
    }
}