package com.launchly.common.outbox;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OutboxServiceTest {

    @Mock
    private OutboxEventRepository outboxEventRepository;

    private ObjectMapper objectMapper;
    private OutboxService outboxService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        outboxService = new OutboxService(outboxEventRepository, objectMapper);
    }

    @Test
    void whenPublishEvent_savesPendingOutboxRecord() {
        when(outboxEventRepository.save(any(OutboxEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        OutboxEvent event = outboxService.publish("ORDER", "123", "ORDER_CREATED", Map.of("total", 100));

        assertThat(event).isNotNull();
        assertThat(event.getAggregateType()).isEqualTo("ORDER");
        assertThat(event.getAggregateId()).isEqualTo("123");
        assertThat(event.getEventType()).isEqualTo("ORDER_CREATED");
        assertThat(event.getStatus()).isEqualTo(OutboxStatus.PENDING);
        assertThat(event.getRetryCount()).isEqualTo(0);
        assertThat(event.getMaxRetries()).isEqualTo(5);
        verify(outboxEventRepository).save(any(OutboxEvent.class));
    }

    @Test
    void whenGetDeadLetterEvents_returnsPaginatedList() {
        Pageable pageable = PageRequest.of(0, 10);
        OutboxEvent dlqEvent = OutboxEvent.builder()
                .id(1L)
                .aggregateType("LEAD")
                .aggregateId("456")
                .eventType("LEAD_CREATED")
                .status(OutboxStatus.DEAD_LETTER)
                .build();
        when(outboxEventRepository.findByStatusOrderByCreatedAtDesc(OutboxStatus.DEAD_LETTER, pageable))
                .thenReturn(new PageImpl<>(List.of(dlqEvent)));

        Page<OutboxEvent> result = outboxService.getDeadLetterEvents(pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getStatus()).isEqualTo(OutboxStatus.DEAD_LETTER);
    }

    @Test
    void whenRetryDeadLetterEvent_resetsStatusToPending() {
        OutboxEvent dlqEvent = OutboxEvent.builder()
                .id(1L)
                .aggregateType("ORDER")
                .aggregateId("123")
                .status(OutboxStatus.DEAD_LETTER)
                .retryCount(5)
                .errorMessage("Network timeout")
                .build();
        when(outboxEventRepository.findById(1L)).thenReturn(Optional.of(dlqEvent));
        when(outboxEventRepository.save(any(OutboxEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        OutboxEvent result = outboxService.retryDeadLetterEvent(1L);

        assertThat(result.getStatus()).isEqualTo(OutboxStatus.PENDING);
        assertThat(result.getRetryCount()).isEqualTo(0);
        assertThat(result.getErrorMessage()).isNull();
        assertThat(result.getNextRetryAt()).isNotNull();
    }

    @Test
    void whenRetryAllDeadLetterEvents_resetsAllEvents() {
        OutboxEvent event1 = OutboxEvent.builder().id(1L).status(OutboxStatus.DEAD_LETTER).build();
        OutboxEvent event2 = OutboxEvent.builder().id(2L).status(OutboxStatus.DEAD_LETTER).build();
        when(outboxEventRepository.findByStatusOrderByCreatedAtDesc(eq(OutboxStatus.DEAD_LETTER), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(event1, event2)));

        int count = outboxService.retryAllDeadLetterEvents();

        assertThat(count).isEqualTo(2);
        assertThat(event1.getStatus()).isEqualTo(OutboxStatus.PENDING);
        assertThat(event2.getStatus()).isEqualTo(OutboxStatus.PENDING);
        verify(outboxEventRepository).saveAll(anyList());
    }
}
