package com.launchly.auth.service.impl;

import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import com.launchly.auth.repository.UserRepository;
import com.launchly.auth.service.UserQueryService;
import com.launchly.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserQueryServiceImpl implements UserQueryService {

    private final UserRepository userRepository;

    @Override
    public User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "auth.error.user_not_found"));
    }

    @Override
    public User getUserByEmailOrThrow(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "auth.error.user_not_found"));
    }

    @Override
    public Optional<User> findById(Long userId) {
        return userRepository.findById(userId);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public Optional<User> findByEmailIgnoreCase(String email) {
        return userRepository.findByEmailIgnoreCase(email);
    }

    @Override
    public Optional<User> findByTelegramUserId(Long telegramUserId) {
        return userRepository.findByTelegramUserId(telegramUserId);
    }

    @Override
    public boolean existsById(Long userId) {
        return userRepository.existsById(userId);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public long countTotalUsers() {
        return userRepository.count();
    }

    @Override
    public long countActiveUsers() {
        return userRepository.countByActiveTrue();
    }

    @Override
    public long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end) {
        return userRepository.countByCreatedAtBetween(start, end);
    }

    @Override
    public long countByRoleInAndCreatedAtBetween(Collection<Role> roles, LocalDateTime start, LocalDateTime end) {
        return userRepository.countByRoleInAndCreatedAtBetween(roles, start, end);
    }

    @Override
    public long countByRoleAndCreatedAtBetween(Role role, LocalDateTime start, LocalDateTime end) {
        return userRepository.countByRoleAndCreatedAtBetween(role, start, end);
    }

    @Override
    public long countByRoleIn(Collection<Role> roles) {
        return userRepository.countByRoleIn(roles);
    }

    @Override
    public long countByActiveTrueAndUpdatedAtAfter(LocalDateTime date) {
        return userRepository.countByActiveTrueAndUpdatedAtAfter(date);
    }

    @Override
    public List<User> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end) {
        return userRepository.findByCreatedAtBetween(start, end);
    }

    @Override
    public List<User> findAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public List<User> findUsersForStatsNotification(String dayOfWeek, int hour) {
        return userRepository.findUsersForStatsNotification(dayOfWeek, hour);
    }

    @Override
    @Transactional
    public User save(User user) {
        return userRepository.save(user);
    }
}
