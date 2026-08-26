package com.launchly.admin.repository;

import com.launchly.admin.entity.SupportMessage;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SupportMessageRepository extends JpaRepository<SupportMessage, Long> {

    @EntityGraph(attributePaths = {"sender"})
    List<SupportMessage> findByTicketIdOrderByCreatedAtAsc(Long ticketId);

    @Override
    @EntityGraph(attributePaths = {"sender"})
    Optional<SupportMessage> findById(Long id);
}
