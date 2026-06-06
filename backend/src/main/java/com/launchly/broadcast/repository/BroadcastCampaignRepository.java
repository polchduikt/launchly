package com.launchly.broadcast.repository;

import com.launchly.broadcast.entity.BroadcastCampaign;
import com.launchly.broadcast.entity.CampaignStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BroadcastCampaignRepository extends JpaRepository<BroadcastCampaign, Long> {

    @Query("SELECT b FROM BroadcastCampaign b WHERE b.status = 'SCHEDULED' AND b.scheduledAt <= :now")
    List<BroadcastCampaign> findScheduledCampaigns(@Param("now") LocalDateTime now);

    List<BroadcastCampaign> findByBotIdOrderByCreatedAtDesc(Long botId);

    List<BroadcastCampaign> findByStatusAndScheduledAtBefore(CampaignStatus status, LocalDateTime dateTime);

    @Query("SELECT COUNT(c) FROM BroadcastCampaign c WHERE c.bot.user.id = :userId AND c.status = :status AND c.updatedAt >= :startDate")
    long countCampaignsSentThisMonth(@org.springframework.data.repository.query.Param("userId") Long userId, @org.springframework.data.repository.query.Param("status") CampaignStatus status, @org.springframework.data.repository.query.Param("startDate") LocalDateTime startDate);
}
