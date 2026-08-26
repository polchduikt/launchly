package com.launchly.admin.repository;

import com.launchly.admin.entity.UserAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserAuditLogRepository extends JpaRepository<UserAuditLog, Long>, JpaSpecificationExecutor<UserAuditLog> {

    @EntityGraph(attributePaths = {"user"})
    List<UserAuditLog> findByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"user"})
    @Query("SELECT u FROM UserAuditLog u WHERE u.user.id = :userId " +
           "AND (:category = 'all' OR LOWER(u.category) = LOWER(:category)) " +
           "AND u.createdAt >= :cutoffDate " +
           "ORDER BY u.createdAt DESC")
    Page<UserAuditLog> findUserLogs(
            @Param("userId") Long userId,
            @Param("category") String category,
            @Param("cutoffDate") LocalDateTime cutoffDate,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"user"})
    @Query("SELECT u FROM UserAuditLog u WHERE u.targetId = :botId " +
           "AND u.createdAt >= :cutoffDate " +
           "ORDER BY u.createdAt DESC")
    Page<UserAuditLog> findAutomationLogs(
            @Param("botId") Long botId,
            @Param("cutoffDate") LocalDateTime cutoffDate,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"user"})
    @Query("SELECT u FROM UserAuditLog u WHERE u.targetId = :campaignId " +
           "AND u.createdAt >= :cutoffDate " +
           "ORDER BY u.createdAt DESC")
    Page<UserAuditLog> findBroadcastLogs(
            @Param("campaignId") Long campaignId,
            @Param("cutoffDate") LocalDateTime cutoffDate,
            Pageable pageable
    );

    @Override
    @EntityGraph(attributePaths = {"user"})
    Optional<UserAuditLog> findById(Long id);

    @Override
    @EntityGraph(attributePaths = {"user"})
    Page<UserAuditLog> findAll(Specification<UserAuditLog> spec, Pageable pageable);
}
