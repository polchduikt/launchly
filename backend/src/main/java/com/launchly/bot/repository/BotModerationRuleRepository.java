package com.launchly.bot.repository;

import com.launchly.bot.entity.BotModerationRule;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BotModerationRuleRepository extends JpaRepository<BotModerationRule, Long> {

    @EntityGraph(attributePaths = {"bot"})
    List<BotModerationRule> findAllByBotId(Long botId);

    @EntityGraph(attributePaths = {"bot"})
    List<BotModerationRule> findAllByBotIdAndEnabledTrue(Long botId);

    @EntityGraph(attributePaths = {"bot"})
    Optional<BotModerationRule> findByBotIdAndChatId(Long botId, String chatId);
}
