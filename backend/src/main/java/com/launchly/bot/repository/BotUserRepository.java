package com.launchly.bot.repository;

import com.launchly.bot.entity.BotUser;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BotUserRepository extends JpaRepository<BotUser, Long> {

    @EntityGraph(attributePaths = {"bot"})
    Optional<BotUser> findByTelegramIdAndBotId(Long telegramId, Long botId);

    @EntityGraph(attributePaths = {"bot"})
    List<BotUser> findAllByBotId(Long botId);

    @Override
    @EntityGraph(attributePaths = {"bot"})
    Optional<BotUser> findById(Long id);

    long countByBotId(Long botId);

    long countByBotIdIn(List<Long> botIds);

    long countByBotIdAndCreatedAtBefore(Long botId, LocalDateTime date);

    long countByBotIdInAndCreatedAtBefore(List<Long> botIds, LocalDateTime date);

    @EntityGraph(attributePaths = {"bot"})
    List<BotUser> findByCurrentNodeIdIsNotNull();

    @Query("SELECT COUNT(DISTINCT bu.telegramId) FROM BotUser bu WHERE bu.bot.id IN :botIds")
    long countDistinctTelegramIdByBotIdIn(@Param("botIds") List<Long> botIds);

    @Query("SELECT COUNT(DISTINCT bu.telegramId) FROM BotUser bu WHERE bu.bot.id IN :botIds AND bu.createdAt < :date")
    long countDistinctTelegramIdByBotIdInAndCreatedAtBefore(@Param("botIds") List<Long> botIds, @Param("date") LocalDateTime date);

    @Query("SELECT MIN(bu.telegramId) FROM BotUser bu WHERE bu.bot.id = :botId")
    Optional<Long> findMinTelegramIdByBotId(@Param("botId") Long botId);

    @Query("SELECT bu.bot.id, COUNT(bu.id) FROM BotUser bu WHERE bu.bot.id IN :botIds GROUP BY bu.bot.id")
    List<Object[]> countGroupedByBotIdIn(@Param("botIds") java.util.Collection<Long> botIds);
}
