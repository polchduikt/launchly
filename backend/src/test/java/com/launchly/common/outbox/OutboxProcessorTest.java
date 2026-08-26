package com.launchly.common.outbox;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OutboxProcessorTest {

    @Mock
    private OutboxEventRepository outboxEventRepository;

    @Mock
    private OutboxEventHandler eventHandler;

    private OutboxProcessor outboxProcessor;

    @BeforeEach
    void setUp() {
        outboxProcessor = new OutboxProcessor(outboxEventRepository, List.of(eventHandler));
    }

    @Test
    void whenHandlerSucceeds_marksEventAsProcessed() throws Exception {
        OutboxEvent event = OutboxEvent.builder()
                .id(1L)
                .aggregateType("CRM_ORDER")
                .aggregateId("100")
                .eventType("ORDER_CREATED")
                .status(OutboxStatus.PENDING)
                .build();

        when(eventHandler.supports("CRM_ORDER", "ORDER_CREATED")).thenReturn(true);
        doNothing().when(eventHandler).handle(event);

        outboxProcessor.processSingleEvent(event);

        assertThat(event.getStatus()).isEqualTo(OutboxStatus.PROCESSED);
        assertThat(event.getProcessedAt()).isNotNull();
        assertThat(event.getErrorMessage()).isNull();
        verify(outboxEventRepository).save(event);
    }

    @Test
    void whenHandlerFailsFirstTime_incrementsRetryAndSetsStatusFailed() throws Exception {
        OutboxEvent event = OutboxEvent.builder()
                .id(1L)
                .aggregateType("CRM_ORDER")
                .aggregateId("100")
                .eventType("ORDER_CREATED")
                .status(OutboxStatus.PENDING)
                .retryCount(0)
                .maxRetries(5)
                .build();

        when(eventHandler.supports("CRM_ORDER", "ORDER_CREATED")).thenReturn(true);
        doThrow(new RuntimeException("Connection timed out")).when(eventHandler).handle(event);

        outboxProcessor.processSingleEvent(event);

        assertThat(event.getStatus()).isEqualTo(OutboxStatus.FAILED);
        assertThat(event.getRetryCount()).isEqualTo(1);
        assertThat(event.getErrorMessage()).isEqualTo("Connection timed out");
        assertThat(event.getNextRetryAt()).isNotNull();
        verify(outboxEventRepository).save(event);
    }

    @Test
    void whenHandlerFailsMaxTimes_movesEventToDeadLetter() throws Exception {
        OutboxEvent event = OutboxEvent.builder()
                .id(1L)
                .aggregateType("CRM_ORDER")
                .aggregateId("100")
                .eventType("ORDER_CREATED")
                .status(OutboxStatus.FAILED)
                .retryCount(4)
                .maxRetries(5)
                .build();

        when(eventHandler.supports("CRM_ORDER", "ORDER_CREATED")).thenReturn(true);
        doThrow(new RuntimeException("Permanent error")).when(eventHandler).handle(event);

        outboxProcessor.processSingleEvent(event);

        assertThat(event.getStatus()).isEqualTo(OutboxStatus.DEAD_LETTER);
        assertThat(event.getRetryCount()).isEqualTo(5);
        assertThat(event.getNextRetryAt()).isNull();
        verify(outboxEventRepository).save(event);
    }

    @Test
    void whenScheduledTrigger_fetchesAndProcessesEvents() throws Exception {
        OutboxEvent event = OutboxEvent.builder()
                .id(1L)
                .aggregateType("CRM_ORDER")
                .aggregateId("100")
                .eventType("ORDER_CREATED")
                .status(OutboxStatus.PENDING)
                .build();
        when(outboxEventRepository.findPendingEventsToProcess(any(Instant.class), any(Pageable.class)))
                .thenReturn(List.of(event));
        when(eventHandler.supports("CRM_ORDER", "ORDER_CREATED")).thenReturn(true);

        outboxProcessor.processOutboxEvents();

        assertThat(event.getStatus()).isEqualTo(OutboxStatus.PROCESSED);
        verify(outboxEventRepository).save(event);
    }
}
