package com.launchly.crm.repository;

import com.launchly.crm.entity.Message;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @EntityGraph(attributePaths = {"conversation"})
    List<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    @EntityGraph(attributePaths = {"conversation"})
    Optional<Message> findFirstByConversationIdOrderByCreatedAtDesc(Long conversationId);

    @EntityGraph(attributePaths = {"conversation", "conversation.bot"})
    List<Message> findBySentFalseAndScheduledAtBefore(LocalDateTime dateTime);
}

