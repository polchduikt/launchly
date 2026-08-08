package com.launchly.bot.repository;

import com.launchly.bot.entity.AccountTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AccountTemplateRepository extends JpaRepository<AccountTemplate, Long> {
    Optional<AccountTemplate> findByShareCode(String shareCode);
    List<AccountTemplate> findAllByCreator_IdOrderByCreatedAtDesc(Long creatorId);
    List<AccountTemplate> findAllByCreatorIdOrderByCreatedAtDesc(Long creatorId);
    void deleteByShareCodeAndCreator_Id(String shareCode, Long creatorId);
}
