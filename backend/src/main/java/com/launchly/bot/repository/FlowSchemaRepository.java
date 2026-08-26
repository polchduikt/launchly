package com.launchly.bot.repository;

import com.launchly.bot.entity.FlowSchema;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface FlowSchemaRepository extends JpaRepository<FlowSchema, Long>, JpaSpecificationExecutor<FlowSchema> {

    @EntityGraph(attributePaths = {"bot"})
    Optional<FlowSchema> findByBotId(Long botId);

    @Override
    @EntityGraph(attributePaths = {"bot"})
    Optional<FlowSchema> findById(Long id);

    @Query("SELECT COUNT(fs) FROM FlowSchema fs WHERE fs.bot.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);

    @EntityGraph(attributePaths = {"bot"})
    @Query("SELECT fs FROM FlowSchema fs WHERE fs.bot.user.id = :userId")
    List<FlowSchema> findAllByUserId(@Param("userId") Long userId);
}
