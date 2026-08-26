package com.launchly.bot.repository;

import com.launchly.bot.entity.BotInvitation;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface BotInvitationRepository extends JpaRepository<BotInvitation, Long> {

    @EntityGraph(attributePaths = {"bot"})
    List<BotInvitation> findByBotId(Long botId);

    @EntityGraph(attributePaths = {"bot"})
    Optional<BotInvitation> findByBotIdAndEmailIgnoreCase(Long botId, String email);

    @EntityGraph(attributePaths = {"bot"})
    List<BotInvitation> findByEmailIgnoreCaseAndAccepted(String email, boolean accepted);

    @EntityGraph(attributePaths = {"bot"})
    Optional<BotInvitation> findByIdAndEmailIgnoreCase(Long id, String email);

    @EntityGraph(attributePaths = {"bot"})
    @Query("SELECT bi FROM BotInvitation bi WHERE bi.bot.user.id = :ownerId")
    List<BotInvitation> findByBotOwnerId(Long ownerId);

    @EntityGraph(attributePaths = {"bot"})
    @Query("SELECT bi FROM BotInvitation bi WHERE bi.bot.user.id = :ownerId AND LOWER(bi.email) = LOWER(:email)")
    Optional<BotInvitation> findByBotOwnerIdAndEmailIgnoreCase(Long ownerId, String email);
}
