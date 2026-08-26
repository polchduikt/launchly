package com.launchly.crm.repository;

import com.launchly.crm.entity.Lead;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LeadRepository extends JpaRepository<Lead, Long> {

    @EntityGraph(attributePaths = {"botUser", "bot"})
    List<Lead> findByBotIdOrderByCreatedAtDesc(Long botId);

    @EntityGraph(attributePaths = {"botUser", "bot"})
    List<Lead> findByBotUserIdAndBotId(Long botUserId, Long botId);

    @Override
    @EntityGraph(attributePaths = {"botUser", "bot"})
    Optional<Lead> findById(Long id);

    boolean existsByBotUserIdAndBotId(Long botUserId, Long botId);
}
