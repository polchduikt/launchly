package com.launchly.bot.repository;

import com.launchly.bot.entity.BotInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface BotInvitationRepository extends JpaRepository<BotInvitation, Long> {

    List<BotInvitation> findByBotId(Long botId);

    Optional<BotInvitation> findByBotIdAndEmailIgnoreCase(Long botId, String email);

    List<BotInvitation> findByEmailIgnoreCaseAndAccepted(String email, boolean accepted);

    Optional<BotInvitation> findByIdAndEmailIgnoreCase(Long id, String email);

    @Query("SELECT bi FROM BotInvitation bi WHERE bi.bot.user.id = :ownerId")
    List<BotInvitation> findByBotOwnerId(Long ownerId);

    @Query("SELECT bi FROM BotInvitation bi WHERE bi.bot.user.id = :ownerId AND LOWER(bi.email) = LOWER(:email)")
    Optional<BotInvitation> findByBotOwnerIdAndEmailIgnoreCase(Long ownerId, String email);
}
