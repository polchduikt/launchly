package com.launchly.auth.repository;

import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    Optional<User> findByTelegramUserId(Long telegramUserId);

    long countByActiveTrue();

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    long countByRoleInAndCreatedAtBetween(Collection<Role> roles, LocalDateTime start, LocalDateTime end);

    long countByRoleAndCreatedAtBetween(Role role, LocalDateTime start, LocalDateTime end);

    long countByRoleIn(Collection<Role> roles);

    long countByActiveTrueAndUpdatedAtAfter(LocalDateTime date);

    List<User> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT u FROM User u WHERE u.statsNotificationsEnabled = true AND " +
           "(UPPER(u.statsDayOfWeek) = 'DAILY' OR UPPER(u.statsDayOfWeek) = :dayOfWeek) AND " +
           "u.statsHour = :hour")
    List<User> findUsersForStatsNotification(
            @Param("dayOfWeek") String dayOfWeek,
            @Param("hour") int hour
    );
}
