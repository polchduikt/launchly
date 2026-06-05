package com.launchly.integration.repository;

import com.launchly.integration.entity.Integration;
import com.launchly.integration.entity.IntegrationType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface IntegrationRepository extends JpaRepository<Integration, Long> {

    List<Integration> findAllByBotUserId(Long userId);

    List<Integration> findAllByBotId(Long botId);

    List<Integration> findAllByBotIdAndActiveTrue(Long botId);

    Optional<Integration> findByBotIdAndType(Long botId, IntegrationType type);
}
