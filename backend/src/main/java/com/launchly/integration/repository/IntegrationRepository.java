package com.launchly.integration.repository;

import com.launchly.integration.entity.Integration;
import com.launchly.integration.entity.IntegrationType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
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

    @Override
    @EntityGraph(attributePaths = {"bot"})
    Optional<Integration> findById(Long id);
}
