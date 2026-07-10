package com.launchly.bot.repository;

import com.launchly.bot.entity.Bot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface BotRepository extends JpaRepository<Bot, Long> {

    List<Bot> findAllByUserId(Long userId);

    long countByUserId(Long userId);

    List<Bot> findAllByActiveTrue();

    @Query("SELECT b FROM Bot b WHERE b.id = :id AND (b.user.id = :userId OR EXISTS (SELECT 1 FROM BotMember bm WHERE bm.bot.user.id = b.user.id AND bm.user.id = :userId))")
    Optional<Bot> findByIdAndUserId(Long id, Long userId);

    boolean existsByTelegramToken(String telegramToken);
}
