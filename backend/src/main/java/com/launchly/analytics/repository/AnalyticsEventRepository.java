package com.launchly.analytics.repository;

import com.launchly.analytics.entity.AnalyticsEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, Long> {

    @Query("SELECT COUNT(e) FROM AnalyticsEvent e WHERE e.bot.id = :botId AND e.eventType = 'CLICK' AND e.createdAt >= :startDate")
    long countClicksByBotIdAndCreatedAtAfter(@Param("botId") Long botId, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT COUNT(e) FROM AnalyticsEvent e WHERE e.bot.id IN :botIds AND e.eventType = 'CLICK' AND e.createdAt >= :startDate")
    long countClicksByBotIdsAndCreatedAtAfter(@Param("botIds") List<Long> botIds, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT COUNT(DISTINCT e.botUser.id) FROM AnalyticsEvent e WHERE e.bot.id = :botId AND e.eventType = 'USER_ACTIVITY' AND e.createdAt >= :startDate")
    long countActiveUsersByBotIdAndCreatedAtAfter(@Param("botId") Long botId, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT COUNT(DISTINCT e.botUser.id) FROM AnalyticsEvent e WHERE e.bot.id IN :botIds AND e.eventType = 'USER_ACTIVITY' AND e.createdAt >= :startDate")
    long countActiveUsersByBotIdsAndCreatedAtAfter(@Param("botIds") List<Long> botIds, @Param("startDate") LocalDateTime startDate);

    @Query(value = "SELECT CAST(created_at AS DATE) as date_val, " +
                  "COUNT(DISTINCT CASE WHEN event_type = 'USER_ACTIVITY' THEN bot_user_id END) as active_users, " +
                  "COUNT(CASE WHEN event_type = 'CLICK' THEN 1 END) as click_count " +
                  "FROM analytics_events " +
                  "WHERE bot_id = :botId AND created_at >= :startDate " +
                  "GROUP BY CAST(created_at AS DATE) " +
                  "ORDER BY date_val ASC", nativeQuery = true)
    List<Object[]> getDailyActivityStats(@Param("botId") Long botId, @Param("startDate") LocalDateTime startDate);

    @Query(value = "SELECT CAST(created_at AS DATE) as date_val, " +
                  "COUNT(DISTINCT CASE WHEN event_type = 'USER_ACTIVITY' THEN bot_user_id END) as active_users, " +
                  "COUNT(CASE WHEN event_type = 'CLICK' THEN 1 END) as click_count " +
                  "FROM analytics_events " +
                  "WHERE bot_id IN :botIds AND created_at >= :startDate " +
                  "GROUP BY CAST(created_at AS DATE) " +
                  "ORDER BY date_val ASC", nativeQuery = true)
    List<Object[]> getDailyActivityStatsForBots(@Param("botIds") List<Long> botIds, @Param("startDate") LocalDateTime startDate);

    @Query(value = "SELECT event_name, COUNT(*) as click_count " +
                  "FROM analytics_events " +
                  "WHERE bot_id = :botId AND event_type = 'CLICK' AND created_at >= :startDate " +
                  "GROUP BY event_name " +
                  "ORDER BY click_count DESC " +
                  "LIMIT :limit", nativeQuery = true)
    List<Object[]> getTopClickedButtons(@Param("botId") Long botId, @Param("startDate") LocalDateTime startDate, @Param("limit") int limit);

    @Query(value = "SELECT event_name, COUNT(*) as click_count " +
                  "FROM analytics_events " +
                  "WHERE bot_id IN :botIds AND event_type = 'CLICK' AND created_at >= :startDate " +
                  "GROUP BY event_name " +
                  "ORDER BY click_count DESC " +
                  "LIMIT :limit", nativeQuery = true)
    List<Object[]> getTopClickedButtonsForBots(@Param("botIds") List<Long> botIds, @Param("startDate") LocalDateTime startDate, @Param("limit") int limit);
}
