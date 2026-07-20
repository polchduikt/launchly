package com.launchly.crm.repository;

import com.launchly.crm.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    Optional<Message> findFirstByConversationIdOrderByCreatedAtDesc(Long conversationId);

    List<Message> findBySentFalseAndScheduledAtBefore(java.time.LocalDateTime dateTime);
}

