package com.launchly.auth.service;

import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserQueryService {

    User getUserOrThrow(Long userId);

    User getUserByEmailOrThrow(String email);

    Optional<User> findById(Long userId);

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByTelegramUserId(Long telegramUserId);

    boolean existsById(Long userId);

    boolean existsByEmail(String email);

    long countTotalUsers();

    long countActiveUsers();

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    long countByRoleInAndCreatedAtBetween(Collection<Role> roles, LocalDateTime start, LocalDateTime end);

    long countByRoleAndCreatedAtBetween(Role role, LocalDateTime start, LocalDateTime end);

    long countByRoleIn(Collection<Role> roles);

    long countByActiveTrueAndUpdatedAtAfter(LocalDateTime date);

    List<User> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<User> findAllUsers();

    List<User> findUsersForStatsNotification(String dayOfWeek, int hour);

    User save(User user);
}
