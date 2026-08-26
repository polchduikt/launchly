package com.launchly.common.outbox;

public interface OutboxEventHandler {

    boolean supports(String aggregateType, String eventType);

    void handle(OutboxEvent event) throws Exception;
}
