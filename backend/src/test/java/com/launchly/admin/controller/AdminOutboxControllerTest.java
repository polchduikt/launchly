package com.launchly.admin.controller;

import com.launchly.common.outbox.OutboxEvent;
import com.launchly.common.outbox.OutboxService;
import com.launchly.common.outbox.OutboxStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminOutboxControllerTest {

    @Mock
    private OutboxService outboxService;

    private AdminOutboxController adminOutboxController;

    @BeforeEach
    void setUp() {
        adminOutboxController = new AdminOutboxController(outboxService);
    }

    @Test
    void whenGetDeadLetterEvents_returnsPaginatedResponse() {
        Pageable pageable = PageRequest.of(0, 20);
        OutboxEvent dlqEvent = OutboxEvent.builder()
                .id(10L)
                .aggregateType("CRM_ORDER")
                .aggregateId("555")
                .eventType("ORDER_CREATED")
                .status(OutboxStatus.DEAD_LETTER)
                .build();
        when(outboxService.getDeadLetterEvents(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(dlqEvent)));

        ResponseEntity<Page<OutboxEvent>> response = adminOutboxController.getDeadLetterEvents(pageable);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getContent()).hasSize(1);
        assertThat(response.getBody().getContent().get(0).getAggregateId()).isEqualTo("555");
    }

    @Test
    void whenRetryEvent_delegatesToService() {
        OutboxEvent resetEvent = OutboxEvent.builder()
                .id(10L)
                .status(OutboxStatus.PENDING)
                .build();
        when(outboxService.retryDeadLetterEvent(10L)).thenReturn(resetEvent);

        ResponseEntity<OutboxEvent> response = adminOutboxController.retryEvent(10L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(OutboxStatus.PENDING);
        verify(outboxService).retryDeadLetterEvent(10L);
    }

    @Test
    void whenRetryAllEvents_returnsRequeuedCount() {
        when(outboxService.retryAllDeadLetterEvents()).thenReturn(3);

        ResponseEntity<Map<String, Object>> response = adminOutboxController.retryAllEvents();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("requeuedCount")).isEqualTo(3);
        assertThat(response.getBody().get("status")).isEqualTo("SUCCESS");
        verify(outboxService).retryAllDeadLetterEvents();
    }
}
