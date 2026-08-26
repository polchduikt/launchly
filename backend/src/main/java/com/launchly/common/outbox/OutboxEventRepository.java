package com.launchly.common.outbox;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEvent, Long> {

    @Query("SELECT e FROM OutboxEvent e WHERE e.status = 'PENDING' OR (e.status = 'FAILED' AND e.nextRetryAt <= :now) ORDER BY e.createdAt ASC")
    List<OutboxEvent> findPendingEventsToProcess(@Param("now") Instant now, Pageable pageable);

    Page<OutboxEvent> findByStatusOrderByCreatedAtDesc(OutboxStatus status, Pageable pageable);

    long countByStatus(OutboxStatus status);
}
