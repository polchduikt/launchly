package com.launchly.bot.repository;

import com.launchly.bot.entity.BotUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BotUserRepository extends JpaRepository<BotUser, Long> {

    Optional<BotUser> findByTelegramIdAndBotId(Long telegramId, Long botId);

    List<BotUser> findAllByBotId(Long botId);

    long countByBotId(Long botId);

    List<BotUser> findByCurrentNodeIdIsNotNull();
}
