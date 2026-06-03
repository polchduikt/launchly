package com.launchly.bot.repository;

import com.launchly.bot.entity.Bot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BotRepository extends JpaRepository<Bot, Long> {

    List<Bot> findAllByUserId(Long userId);

    List<Bot> findAllByActiveTrue();

    Optional<Bot> findByIdAndUserId(Long id, Long userId);

    boolean existsByTelegramToken(String telegramToken);
}
