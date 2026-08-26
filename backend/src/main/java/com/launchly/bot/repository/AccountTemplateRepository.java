package com.launchly.bot.repository;

import com.launchly.bot.entity.AccountTemplate;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AccountTemplateRepository extends JpaRepository<AccountTemplate, Long> {

    @EntityGraph(attributePaths = {"creator", "sourceBot"})
    Optional<AccountTemplate> findByShareCode(String shareCode);

    @EntityGraph(attributePaths = {"creator", "sourceBot"})
    List<AccountTemplate> findAllByCreator_IdOrderByCreatedAtDesc(Long creatorId);

    @EntityGraph(attributePaths = {"creator", "sourceBot"})
    List<AccountTemplate> findAllByCreatorIdOrderByCreatedAtDesc(Long creatorId);

    @Override
    @EntityGraph(attributePaths = {"creator", "sourceBot"})
    Optional<AccountTemplate> findById(Long id);

    void deleteByShareCodeAndCreator_Id(String shareCode, Long creatorId);

    @Modifying
    @Query("UPDATE AccountTemplate t SET t.sourceBot = null WHERE t.sourceBot.id = :botId")
    void detachSourceBot(@Param("botId") Long botId);
}
