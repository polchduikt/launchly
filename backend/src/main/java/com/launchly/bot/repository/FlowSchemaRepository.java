package com.launchly.bot.repository;

import com.launchly.bot.entity.FlowSchema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface FlowSchemaRepository extends JpaRepository<FlowSchema, Long> {

    Optional<FlowSchema> findByBotId(Long botId);

    @Query("SELECT COUNT(fs) FROM FlowSchema fs WHERE fs.bot.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);
}
