package com.launchly.bot.repository;

import com.launchly.bot.entity.FlowSchema;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FlowSchemaRepository extends JpaRepository<FlowSchema, Long> {

    Optional<FlowSchema> findByBotId(Long botId);
}
