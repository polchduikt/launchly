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

    @Query("SELECT c FROM BroadcastCampaign c LEFT JOIN c.bot b LEFT JOIN b.user u WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(COALESCE(u.email, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(COALESCE(u.name, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(COALESCE(b.name, '')) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status = 'all' OR UPPER(CAST(c.status AS string)) = UPPER(:status)) " +
           "ORDER BY c.createdAt DESC")
    org.springframework.data.domain.Page<BroadcastCampaign> findAdminBroadcasts(
            @Param("search") String search,
            @Param("status") String status,
            org.springframework.data.domain.Pageable pageable
    );
}
