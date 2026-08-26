package com.launchly.crm.repository;

import com.launchly.crm.entity.Conversation;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @EntityGraph(attributePaths = {"botUser", "bot"})
    List<Conversation> findByBotIdOrderByUpdatedAtDesc(Long botId);

    @EntityGraph(attributePaths = {"botUser", "bot"})
    @Query("SELECT c FROM Conversation c WHERE c.bot.user.id = :userId ORDER BY c.updatedAt DESC")
    List<Conversation> findByBotUserIdOrderByUpdatedAtDesc(@Param("userId") Long userId);

    @EntityGraph(attributePaths = {"botUser", "bot"})
    Optional<Conversation> findByBotIdAndBotUserId(Long botId, Long botUserId);

    @Override
    @EntityGraph(attributePaths = {"botUser", "bot"})
    Optional<Conversation> findById(Long id);

    long countByBotId(Long botId);
}
