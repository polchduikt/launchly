package com.launchly.bot.repository;

import com.launchly.bot.entity.BotUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface BotUserRepository extends JpaRepository<BotUser, Long> {

    Optional<BotUser> findByTelegramIdAndBotId(Long telegramId, Long botId);

    List<BotUser> findAllByBotId(Long botId);

    long countByBotId(Long botId);

    long countByBotIdIn(List<Long> botIds);

    List<BotUser> findByCurrentNodeIdIsNotNull();

    @Query("SELECT MIN(bu.telegramId) FROM BotUser bu WHERE bu.bot.id = :botId")
    Optional<Long> findMinTelegramIdByBotId(@Param("botId") Long botId);
}
