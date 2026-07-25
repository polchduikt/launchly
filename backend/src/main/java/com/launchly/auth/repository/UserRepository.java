package com.launchly.auth.repository;

import com.launchly.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmail(String email);

    Optional<User> findByTelegramUserId(Long telegramUserId);

    @Query("SELECT u FROM User u WHERE u.statsNotificationsEnabled = true AND " +
           "(UPPER(u.statsDayOfWeek) = 'DAILY' OR UPPER(u.statsDayOfWeek) = :dayOfWeek) AND " +
           "u.statsHour = :hour")
    List<User> findUsersForStatsNotification(
            @Param("dayOfWeek") String dayOfWeek,
            @Param("hour") int hour
    );
}
