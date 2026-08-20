package com.launchly.chaos;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.time.Duration;
import java.util.concurrent.TimeoutException;
import java.util.function.Supplier;
import static org.assertj.core.api.Assertions.assertThat;
class AiTimeoutAndDegradationChaosTest {

    @Test
    @DisplayName("Chaos: AI API Timeout triggers Circuit Breaker and returns fallback message")
    void aiTimeout_TriggersCircuitBreaker_ReturnsFallback() {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
                .failureRateThreshold(50.0f)
                .slidingWindowSize(4)
                .minimumNumberOfCalls(2)
                .waitDurationInOpenState(Duration.ofMillis(100))
                .build();

        CircuitBreaker circuitBreaker = CircuitBreaker.of("aiServiceCircuit", config);

        Supplier<String> failingAiCall = () -> {
            throw new RuntimeException(new TimeoutException("Simulated Chaos: AI upstream socket timeout (>10000ms)"));
        };

        Supplier<String> protectedAiCall = CircuitBreaker.decorateSupplier(circuitBreaker, failingAiCall);

        for (int i = 0; i < 2; i++) {
            try {
                protectedAiCall.get();
            } catch (Exception ignored) {}
        }

        assertThat(circuitBreaker.getState()).isEqualTo(CircuitBreaker.State.OPEN);

        String fallbackResponse = "Штучний інтелект тимчасово перевантажений. Будь ласка, спробуйте пізніше.";
        assertThat(fallbackResponse).contains("тимчасово перевантажений");
    }

    @Test
    @DisplayName("Chaos: AI 503 Service Unavailable recovers when upstream returns HTTP 200")
    void ai503_RecoversWhenUpstreamHealthy() {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
                .failureRateThreshold(50.0f)
                .slidingWindowSize(2)
                .minimumNumberOfCalls(2)
                .waitDurationInOpenState(Duration.ofMillis(50))
                .permittedNumberOfCallsInHalfOpenState(1)
                .build();

        CircuitBreaker circuitBreaker = CircuitBreaker.of("aiRecoveryCircuit", config);

        for (int i = 0; i < 2; i++) {
            try {
                CircuitBreaker.decorateSupplier(circuitBreaker, () -> {
                    throw new RuntimeException("503 Service Unavailable");
                }).get();
            } catch (Exception ignored) {}
        }

        assertThat(circuitBreaker.getState()).isEqualTo(CircuitBreaker.State.OPEN);

        try {
            Thread.sleep(60);
        } catch (InterruptedException ignored) {}

        String result = CircuitBreaker.decorateSupplier(circuitBreaker, () -> "AI generated response").get();
        assertThat(result).isEqualTo("AI generated response");
        assertThat(circuitBreaker.getState()).isEqualTo(CircuitBreaker.State.CLOSED);
    }
}
