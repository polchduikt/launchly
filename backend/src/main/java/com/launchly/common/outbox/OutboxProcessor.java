package com.launchly.common.outbox;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class OutboxProcessor {

    private final OutboxEventRepository outboxEventRepository;
    private final List<OutboxEventHandler> eventHandlers;

    @Scheduled(fixedDelayString = "${app.outbox.interval-ms:3000}")
    public void processOutboxEvents() {
        Instant now = Instant.now();
        List<OutboxEvent> pendingEvents = outboxEventRepository.findPendingEventsToProcess(now, PageRequest.of(0, 50));
        if (pendingEvents.isEmpty()) {
            return;
        }

        for (OutboxEvent event : pendingEvents) {
            processSingleEvent(event);
        }
    }

    public void processSingleEvent(OutboxEvent event) {
        try {
            boolean handled = false;
            for (OutboxEventHandler handler : eventHandlers) {
                if (handler.supports(event.getAggregateType(), event.getEventType())) {
                    handler.handle(event);
                    handled = true;
                }
            }

            event.setStatus(OutboxStatus.PROCESSED);
            event.setProcessedAt(Instant.now());
            event.setErrorMessage(null);
            outboxEventRepository.save(event);
        } catch (Exception e) {
            handleProcessingFailure(event, e);
        }
    }

    private void handleProcessingFailure(OutboxEvent event, Exception e) {
        int nextRetry = event.getRetryCount() + 1;
        event.setRetryCount(nextRetry);
        String error = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
        event.setErrorMessage(error.length() > 1000 ? error.substring(0, 1000) : error);

        if (nextRetry >= event.getMaxRetries()) {
            event.setStatus(OutboxStatus.DEAD_LETTER);
            event.setNextRetryAt(null);
            log.error("Outbox event [id={}, aggregate={}, event={}] exceeded max retries. Moved to DEAD_LETTER.",
                    event.getId(), event.getAggregateType(), event.getEventType(), e);
        } else {
            event.setStatus(OutboxStatus.FAILED);
            long backoffSeconds = (long) Math.pow(2, nextRetry) * 5L;
            event.setNextRetryAt(Instant.now().plusSeconds(backoffSeconds));
            log.warn("Outbox event [id={}, aggregate={}, event={}] failed (attempt {}/{}). Next retry in {}s: {}",
                    event.getId(), event.getAggregateType(), event.getEventType(), nextRetry, event.getMaxRetries(), backoffSeconds, error);
        }

        outboxEventRepository.save(event);
    }
}
