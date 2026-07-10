package com.launchly.bot.repository;

import com.launchly.bot.entity.BotMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface BotMemberRepository extends JpaRepository<BotMember, Long> {

    List<BotMember> findByBotId(Long botId);

    List<BotMember> findByUserId(Long userId);

    Optional<BotMember> findByBotIdAndUserId(Long botId, Long userId);

    boolean existsByBotIdAndUserId(Long botId, Long userId);

    void deleteByBotIdAndUserId(Long botId, Long userId);

    @Query("SELECT bm FROM BotMember bm WHERE bm.user.id = :userId AND bm.bot.user.id = (SELECT b.user.id FROM Bot b WHERE b.id = :botId) ORDER BY CASE WHEN LOWER(bm.role) = 'admin' THEN 1 WHEN LOWER(bm.role) = 'editor' THEN 2 ELSE 3 END ASC")
    List<BotMember> findWorkspaceMemberships(Long botId, Long userId);

    @Query("SELECT COUNT(bm) > 0 FROM BotMember bm WHERE bm.bot.user.id = :ownerId AND bm.user.id = :userId")
    boolean existsByBotOwnerIdAndUserId(Long ownerId, Long userId);

    @Query("SELECT bm FROM BotMember bm WHERE bm.bot.user.id = :ownerId")
    List<BotMember> findByBotOwnerId(Long ownerId);

    @Query("SELECT bm FROM BotMember bm WHERE bm.bot.user.id = :ownerId AND bm.user.id = :userId")
    List<BotMember> findByBotOwnerIdAndUserId(Long ownerId, Long userId);
}
