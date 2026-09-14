package com.launchly.bot.repository;

import com.launchly.bot.entity.BotUserInteraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface BotUserInteractionRepository extends JpaRepository<BotUserInteraction, Long> {

    boolean existsByBotIdAndSourceTelegramIdAndTargetTelegramIdAndInteractionType(
            Long botId, Long sourceTelegramId, Long targetTelegramId, String interactionType
    );

    @Query("SELECT i.targetTelegramId FROM BotUserInteraction i WHERE i.bot.id = :botId AND i.sourceTelegramId = :sourceTelegramId AND i.interactionType IN :types")
    List<Long> findInteractedTargetTelegramIds(
            @Param("botId") Long botId,
            @Param("sourceTelegramId") Long sourceTelegramId,
            @Param("types") List<String> types
    );

    Optional<BotUserInteraction> findByBotIdAndSourceTelegramIdAndTargetTelegramIdAndInteractionType(
            Long botId, Long sourceTelegramId, Long targetTelegramId, String interactionType
    );

    long countByBotIdAndTargetTelegramIdAndInteractionType(
            Long botId, Long targetTelegramId, String interactionType
    );
}
