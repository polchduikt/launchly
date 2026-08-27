package com.launchly.admin.repository;

import com.launchly.admin.entity.SupportTicket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long>, JpaSpecificationExecutor<SupportTicket> {

    @EntityGraph(attributePaths = {"user", "assignedManager"})
    @Query("SELECT t FROM SupportTicket t WHERE t.user.id = :userId ORDER BY t.updatedAt DESC")
    Optional<SupportTicket> findFirstByUserId(@Param("userId") Long userId);

    @EntityGraph(attributePaths = {"user", "assignedManager"})
    Page<SupportTicket> findByUserId(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "assignedManager"})
    Page<SupportTicket> findByStatus(String status, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "assignedManager"})
    Page<SupportTicket> findByUnreadForAdminTrue(Pageable pageable);

    @EntityGraph(attributePaths = {"user", "assignedManager"})
    Page<SupportTicket> findByIsFavoriteTrue(Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"user", "assignedManager"})
    Optional<SupportTicket> findById(Long id);

    @Override
    @EntityGraph(attributePaths = {"user", "assignedManager"})
    Page<SupportTicket> findAll(Specification<SupportTicket> spec, Pageable pageable);
}
