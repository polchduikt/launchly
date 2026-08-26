package com.launchly.bot.repository;

import com.launchly.bot.entity.InstalledTemplate;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface InstalledTemplateRepository extends JpaRepository<InstalledTemplate, Long> {
    @Query("SELECT COUNT(it) > 0 FROM InstalledTemplate it WHERE it.user.id = :userId AND it.template.id = :templateId")
    boolean existsByUserIdAndTemplateId(@Param("userId") Long userId, @Param("templateId") Long templateId);

    @Query("SELECT COUNT(it) > 0 FROM InstalledTemplate it WHERE it.user.id = :userId AND it.template.id = :templateId")
    boolean existsByUserIdAndTemplate_Id(@Param("userId") Long userId, @Param("templateId") Long templateId);

    @EntityGraph(attributePaths = {"template", "template.creator", "bot"})
    Optional<InstalledTemplate> findByUserIdAndTemplateId(Long userId, Long templateId);

    @Override
    @EntityGraph(attributePaths = {"template", "template.creator", "bot"})
    Optional<InstalledTemplate> findById(Long id);
    
    @EntityGraph(attributePaths = {"template", "template.creator", "bot"})
    List<InstalledTemplate> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    
    @EntityGraph(attributePaths = {"template", "template.creator", "bot"})
    @Query("SELECT it FROM InstalledTemplate it WHERE it.user.id = :userId ORDER BY it.createdAt DESC")
    List<InstalledTemplate> findAllByUserIdOrderByInstalledAtDesc(@Param("userId") Long userId);
    
    @Modifying
    @Query("DELETE FROM InstalledTemplate it WHERE it.user.id = :userId AND it.template.id = :templateId")
    void deleteByUserIdAndTemplateId(@Param("userId") Long userId, @Param("templateId") Long templateId);

    @Modifying
    @Query("DELETE FROM InstalledTemplate it WHERE it.user.id = :userId AND it.template.id = :templateId")
    void deleteByUserIdAndTemplate_Id(@Param("userId") Long userId, @Param("templateId") Long templateId);

    @Modifying
    @Query("DELETE FROM InstalledTemplate it WHERE it.user.id = :userId AND it.template.shareCode = :shareCode")
    void deleteByUserIdAndTemplate_ShareCode(@Param("userId") Long userId, @Param("shareCode") String shareCode);

    @Modifying
    @Query("DELETE FROM InstalledTemplate it WHERE it.template.id = :templateId")
    void deleteAllByTemplateId(@Param("templateId") Long templateId);

    @Modifying
    @Query("DELETE FROM InstalledTemplate it WHERE it.bot.id = :botId")
    void deleteAllByBotId(@Param("botId") Long botId);

    long countByTemplateId(Long templateId);
}
