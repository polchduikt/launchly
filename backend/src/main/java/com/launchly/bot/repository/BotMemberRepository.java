package com.launchly.bot.repository;

import com.launchly.bot.entity.BotMember;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface BotMemberRepository extends JpaRepository<BotMember, Long> {

    @EntityGraph(attributePaths = {"user", "bot"})
    List<BotMember> findByBotId(Long botId);

    @EntityGraph(attributePaths = {"user", "bot"})
    List<BotMember> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"user", "bot"})
    Optional<BotMember> findByBotIdAndUserId(Long botId, Long userId);

    @Override
    @EntityGraph(attributePaths = {"user", "bot"})
    Optional<BotMember> findById(Long id);

    boolean existsByBotIdAndUserId(Long botId, Long userId);

    void deleteByBotIdAndUserId(Long botId, Long userId);

    @EntityGraph(attributePaths = {"user", "bot"})
    @Query("SELECT bm FROM BotMember bm WHERE bm.user.id = :userId AND bm.bot.user.id = (SELECT b.user.id FROM Bot b WHERE b.id = :botId) ORDER BY CASE WHEN LOWER(bm.role) = 'admin' THEN 1 WHEN LOWER(bm.role) = 'editor' THEN 2 ELSE 3 END ASC")
    List<BotMember> findWorkspaceMemberships(Long botId, Long userId);

    @Query("SELECT COUNT(bm) > 0 FROM BotMember bm WHERE bm.bot.user.id = :ownerId AND bm.user.id = :userId")
    boolean existsByBotOwnerIdAndUserId(Long ownerId, Long userId);

    @EntityGraph(attributePaths = {"user", "bot"})
    @Query("SELECT bm FROM BotMember bm WHERE bm.bot.user.id = :ownerId")
    List<BotMember> findByBotOwnerId(Long ownerId);

    @EntityGraph(attributePaths = {"user", "bot"})
    @Query("SELECT bm FROM BotMember bm WHERE bm.bot.user.id = :ownerId AND bm.user.id = :userId")
    List<BotMember> findByBotOwnerIdAndUserId(Long ownerId, Long userId);
}
