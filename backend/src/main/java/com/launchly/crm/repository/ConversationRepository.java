package com.launchly.crm.repository;

import com.launchly.crm.entity.Conversation;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @EntityGraph(attributePaths = {"bot", "botUser"})
    List<Conversation> findByBotIdOrderByUpdatedAtDesc(Long botId);

    @EntityGraph(attributePaths = {"bot", "botUser"})
    @Query("SELECT c FROM Conversation c WHERE (c.bot.user.id = :userId OR EXISTS (SELECT 1 FROM BotMember bm WHERE bm.bot.user.id = c.bot.user.id AND bm.user.id = :userId)) ORDER BY c.updatedAt DESC")
    List<Conversation> findByBotUserIdOrderByUpdatedAtDesc(@Param("userId") Long userId);

    @EntityGraph(attributePaths = {"bot", "botUser"})
    Optional<Conversation> findByBotIdAndBotUserId(Long botId, Long botUserId);

    @Override
    @EntityGraph(attributePaths = {"bot", "botUser"})
    Optional<Conversation> findById(Long id);

    long countByBotId(Long botId);
}
