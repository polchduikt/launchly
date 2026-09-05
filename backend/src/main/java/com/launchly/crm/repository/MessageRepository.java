package com.launchly.crm.repository;

import com.launchly.crm.entity.Message;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @EntityGraph(attributePaths = {"conversation"})
    List<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    @EntityGraph(attributePaths = {"conversation"})
    Optional<Message> findFirstByConversationIdOrderByCreatedAtDesc(Long conversationId);

    @EntityGraph(attributePaths = {"conversation", "conversation.bot"})
    List<Message> findBySentFalseAndScheduledAtBefore(LocalDateTime dateTime);

    @EntityGraph(attributePaths = {"conversation"})
    @Query("SELECT m FROM Message m WHERE m.id IN (SELECT MAX(m2.id) FROM Message m2 WHERE m2.conversation.id IN :conversationIds GROUP BY m2.conversation.id)")
    List<Message> findLatestMessagesByConversationIds(@Param("conversationIds") Collection<Long> conversationIds);
}
