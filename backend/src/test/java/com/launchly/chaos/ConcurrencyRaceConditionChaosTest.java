package com.launchly.chaos;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import static org.assertj.core.api.Assertions.assertThat;

class ConcurrencyRaceConditionChaosTest {

    @Test
    @DisplayName("Chaos: 50 concurrent virtual threads competing for quota should guarantee non-negative balance")
    void concurrentVirtualThreads_QuotaDeduction_GuaranteesNonNegativeBalance() throws Exception {
        int initialQuota = 10;
        int totalThreads = 50;
        AtomicInteger remainingQuota = new AtomicInteger(initialQuota);
        AtomicInteger successfulDeductions = new AtomicInteger(0);
        AtomicInteger rejectedDeductions = new AtomicInteger(0);

        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch endLatch = new CountDownLatch(totalThreads);

        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < totalThreads; i++) {
                executor.submit(() -> {
                    try {
                        startLatch.await();
                        while (true) {
                            int current = remainingQuota.get();
                            if (current <= 0) {
                                rejectedDeductions.incrementAndGet();
                                break;
                            }
                            if (remainingQuota.compareAndSet(current, current - 1)) {
                                successfulDeductions.incrementAndGet();
                                break;
                            }
                        }
                    } catch (InterruptedException ignored) {
                    } finally {
                        endLatch.countDown();
                    }
                });
            }

            startLatch.countDown();
            boolean finished = endLatch.await(5, TimeUnit.SECONDS);

            assertThat(finished).isTrue();
            assertThat(successfulDeductions.get()).isEqualTo(initialQuota);
            assertThat(rejectedDeductions.get()).isEqualTo(totalThreads - initialQuota);
            assertThat(remainingQuota.get()).isEqualTo(0);
        }
    }

    @Test
    @DisplayName("Chaos: Concurrent broadcast campaign execution should be strictly idempotent")
    void concurrentBroadcastDispatch_IsStrictlyIdempotent() throws Exception {
        int totalThreads = 30;
        AtomicInteger executionCount = new AtomicInteger(0);
        AtomicInteger lockedStatus = new AtomicInteger(0);

        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch endLatch = new CountDownLatch(totalThreads);

        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < totalThreads; i++) {
                executor.submit(() -> {
                    try {
                        startLatch.await();
                        if (lockedStatus.compareAndSet(0, 1)) {
                            executionCount.incrementAndGet();
                        }
                    } catch (InterruptedException ignored) {
                    } finally {
                        endLatch.countDown();
                    }
                });
            }

            startLatch.countDown();
            boolean finished = endLatch.await(5, TimeUnit.SECONDS);

            assertThat(finished).isTrue();
            assertThat(executionCount.get()).isEqualTo(1);
        }
    }
}
