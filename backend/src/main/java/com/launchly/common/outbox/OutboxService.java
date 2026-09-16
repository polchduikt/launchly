package com.launchly.common.outbox;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.launchly.common.exception.AppException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.DeserializationFeature;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
public class OutboxService {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    public OutboxService(OutboxEventRepository outboxEventRepository,
                         @Autowired(required = false) ObjectMapper objectMapper) {
        this.outboxEventRepository = outboxEventRepository;
        if (objectMapper != null) {
            this.objectMapper = objectMapper;
        } else {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
            mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
            this.objectMapper = mapper;
        }
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public OutboxEvent publish(String aggregateType, String aggregateId, String eventType, Object payload) {
        String jsonPayload;
        try {
            jsonPayload = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.error("Failed to serialize outbox event payload for {} - {}", aggregateType, aggregateId, e);
            jsonPayload = "{}";
        }
        return publishRaw(aggregateType, aggregateId, eventType, jsonPayload);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public OutboxEvent publishRaw(String aggregateType, String aggregateId, String eventType, String jsonPayload) {
        OutboxEvent event = OutboxEvent.builder()
                .aggregateType(aggregateType)
                .aggregateId(aggregateId)
                .eventType(eventType)
                .payload(jsonPayload)
                .status(OutboxStatus.PENDING)
                .retryCount(0)
                .maxRetries(5)
                .createdAt(Instant.now())
                .build();
        return outboxEventRepository.save(event);
    }

    @Transactional(readOnly = true)
    public Page<OutboxEvent> getDeadLetterEvents(Pageable pageable) {
        return outboxEventRepository.findByStatusOrderByCreatedAtDesc(OutboxStatus.DEAD_LETTER, pageable);
    }

    @Transactional
    public OutboxEvent retryDeadLetterEvent(Long id) {
        OutboxEvent event = outboxEventRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "common.error.not_found"));
        if (event.getStatus() != OutboxStatus.DEAD_LETTER && event.getStatus() != OutboxStatus.FAILED) {
            throw new AppException(HttpStatus.BAD_REQUEST, "common.error.invalid_input");
        }
        event.setStatus(OutboxStatus.PENDING);
        event.setRetryCount(0);
        event.setErrorMessage(null);
        event.setNextRetryAt(Instant.now());
        return outboxEventRepository.save(event);
    }

    @Transactional
    public int retryAllDeadLetterEvents() {
        List<OutboxEvent> deadLetterEvents = outboxEventRepository
                .findByStatusOrderByCreatedAtDesc(OutboxStatus.DEAD_LETTER, Pageable.unpaged())
                .getContent();
        for (OutboxEvent event : deadLetterEvents) {
            event.setStatus(OutboxStatus.PENDING);
            event.setRetryCount(0);
            event.setErrorMessage(null);
            event.setNextRetryAt(Instant.now());
        }
        outboxEventRepository.saveAll(deadLetterEvents);
        return deadLetterEvents.size();
    }
}
