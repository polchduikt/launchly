package com.launchly.admin.repository;

import com.launchly.admin.entity.SupportTicket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long>, JpaSpecificationExecutor<SupportTicket> {

    @Query("SELECT t FROM SupportTicket t WHERE t.user.id = :userId ORDER BY t.updatedAt DESC")
    Optional<SupportTicket> findFirstByUserId(@Param("userId") Long userId);

    Page<SupportTicket> findByStatus(String status, Pageable pageable);

    Page<SupportTicket> findByUnreadForAdminTrue(Pageable pageable);

    Page<SupportTicket> findByIsFavoriteTrue(Pageable pageable);
}
