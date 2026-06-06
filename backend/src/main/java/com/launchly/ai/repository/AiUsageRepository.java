package com.launchly.ai.repository;

import com.launchly.ai.entity.AiUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface AiUsageRepository extends JpaRepository<AiUsage, Long> {
    Optional<AiUsage> findByUserIdAndDate(Long userId, LocalDate date);
}
