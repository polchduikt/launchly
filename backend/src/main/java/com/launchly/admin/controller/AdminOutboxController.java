package com.launchly.admin.controller;

import com.launchly.common.outbox.OutboxEvent;
import com.launchly.common.outbox.OutboxService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Tag(name = "Admin: Outbox & DLQ", description = "Dead letter queue inspection and event replay management")
@RestController
@RequestMapping("/api/v1/admin/outbox")
@PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminOutboxController {

    private final OutboxService outboxService;

    @Operation(summary = "List dead letter outbox events", description = "Retrieve paginated list of failed outbox events that exceeded maximum retry attempts.")
    @GetMapping("/dead-letter")
    public ResponseEntity<Page<OutboxEvent>> getDeadLetterEvents(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(outboxService.getDeadLetterEvents(pageable));
    }

    @Operation(summary = "Retry specific dead letter event", description = "Reset retry count and requeue an event back to PENDING status.")
    @PostMapping("/{id}/retry")
    public ResponseEntity<OutboxEvent> retryEvent(@Parameter(description = "Outbox Event ID") @PathVariable Long id) {
        return ResponseEntity.ok(outboxService.retryDeadLetterEvent(id));
    }

    @Operation(summary = "Retry all dead letter events", description = "Requeue all failed dead letter events back into the processing queue.")
    @PostMapping("/retry-all")
    public ResponseEntity<Map<String, Object>> retryAllEvents() {
        int count = outboxService.retryAllDeadLetterEvents();
        return ResponseEntity.ok(Map.of("requeuedCount", count, "status", "SUCCESS"));
    }
}
