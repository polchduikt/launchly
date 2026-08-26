package com.launchly.broadcast.repository;

import com.launchly.broadcast.entity.BroadcastCampaign;
import com.launchly.broadcast.entity.CampaignStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BroadcastCampaignRepository extends JpaRepository<BroadcastCampaign, Long> {

    @EntityGraph(attributePaths = {"bot"})
    @Query("SELECT b FROM BroadcastCampaign b WHERE b.status = 'SCHEDULED' AND b.scheduledAt <= :now")
    List<BroadcastCampaign> findScheduledCampaigns(@Param("now") LocalDateTime now);

    @EntityGraph(attributePaths = {"bot"})
    List<BroadcastCampaign> findByBotIdOrderByCreatedAtDesc(Long botId);

    @Override
    @EntityGraph(attributePaths = {"bot"})
    Optional<BroadcastCampaign> findById(Long id);

    @Query("SELECT COUNT(c) FROM BroadcastCampaign c WHERE c.bot.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);

    @EntityGraph(attributePaths = {"bot"})
    List<BroadcastCampaign> findByStatusAndScheduledAtBefore(CampaignStatus status, LocalDateTime dateTime);

    @Query("SELECT COUNT(c) FROM BroadcastCampaign c WHERE c.bot.user.id = :userId AND c.status = :status AND c.updatedAt >= :startDate")
    long countCampaignsSentThisMonth(@Param("userId") Long userId, @Param("status") CampaignStatus status, @Param("startDate") LocalDateTime startDate);

    @EntityGraph(attributePaths = {"bot", "bot.user"})
    @Query("SELECT c FROM BroadcastCampaign c LEFT JOIN c.bot b LEFT JOIN b.user u WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(COALESCE(u.email, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(COALESCE(u.name, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(COALESCE(b.name, '')) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status = 'all' OR UPPER(CAST(c.status AS string)) = UPPER(:status)) " +
           "ORDER BY c.createdAt DESC")
    Page<BroadcastCampaign> findAdminBroadcasts(
            @Param("search") String search,
            @Param("status") String status,
            Pageable pageable
    );
}
