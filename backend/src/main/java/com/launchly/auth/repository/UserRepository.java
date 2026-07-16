package com.launchly.auth.repository;

import com.launchly.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmail(String email);

    Optional<User> findByTelegramUserId(Long telegramUserId);
}
