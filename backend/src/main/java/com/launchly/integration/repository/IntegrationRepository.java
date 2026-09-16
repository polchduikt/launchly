package com.launchly.integration.repository;

import com.launchly.integration.entity.Integration;
import com.launchly.integration.entity.IntegrationType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface IntegrationRepository extends JpaRepository<Integration, Long> {

    @EntityGraph(attributePaths = {"bot"})
    List<Integration> findAllByBotUserId(Long userId);

    @EntityGraph(attributePaths = {"bot"})
    List<Integration> findAllByBotId(Long botId);

    @EntityGraph(attributePaths = {"bot"})
    List<Integration> findAllByBotIdAndActiveTrue(Long botId);

    @EntityGraph(attributePaths = {"bot"})
    Optional<Integration> findByBotIdAndType(Long botId, IntegrationType type);

    @Query("SELECT i.type, COUNT(i) FROM Integration i GROUP BY i.type")
    List<Object[]> countGroupedByType();

    @Query("SELECT i.type, COUNT(i) FROM Integration i WHERE i.createdAt < :date GROUP BY i.type")
    List<Object[]> countGroupedByTypeAndCreatedAtBefore(@Param("date") LocalDateTime date);

    @Override
    @EntityGraph(attributePaths = {"bot"})
    Optional<Integration> findById(Long id);
}
