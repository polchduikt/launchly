package com.launchly.common.outbox;

public enum OutboxStatus {
    PENDING,
    PROCESSING,
    PROCESSED,
    FAILED,
    DEAD_LETTER
}
