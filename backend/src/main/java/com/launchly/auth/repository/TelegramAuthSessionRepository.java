package com.launchly.auth.repository;

import com.launchly.auth.entity.TelegramAuthSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TelegramAuthSessionRepository extends JpaRepository<TelegramAuthSession, Long> {

    Optional<TelegramAuthSession> findByToken(String token);
}
