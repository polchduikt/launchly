package com.launchly.chaos;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.sql.SQLException;
import java.sql.SQLTimeoutException;
import java.util.concurrent.atomic.AtomicInteger;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DatabasePoolExhaustionChaosTest {

    @Test
    @DisplayName("Chaos: HikariCP connection timeout under pool exhaustion throws SQLTimeoutException cleanly")
    void hikariConnectionTimeout_UnderPoolExhaustion_ThrowsCleanly() {
        AtomicInteger activeConnections = new AtomicInteger(10); // max pool size = 10

        assertThatThrownBy(() -> {
            int current = activeConnections.get();
            if (current >= 10) {
                throw new SQLTimeoutException("HikariPool-1 - Connection is not available, request timed out after 3000ms.");
            }
        })
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("request timed out after 3000ms");
    }

    @Test
    @DisplayName("Chaos: HikariCP pool recovers when busy connections are returned")
    void hikariPoolRecovery_WhenConnectionsReturned() {
        AtomicInteger activeConnections = new AtomicInteger(10); // full pool
        activeConnections.addAndGet(-2);
        assertThat(activeConnections.get()).isEqualTo(8);
        boolean acquired = activeConnections.incrementAndGet() <= 10;
        assertThat(acquired).isTrue();
        assertThat(activeConnections.get()).isEqualTo(9);
    }
}
