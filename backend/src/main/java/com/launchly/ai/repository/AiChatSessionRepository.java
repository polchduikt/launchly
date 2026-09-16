package com.launchly.ai.repository;

import com.launchly.ai.entity.AiChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiChatSessionRepository extends JpaRepository<AiChatSession, Long> {

    List<AiChatSession> findAllByUserIdOrderByUpdatedAtDesc(Long userId);

    Optional<AiChatSession> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT s FROM AiChatSession s LEFT JOIN FETCH s.messages WHERE s.id = :id AND s.user.id = :userId")
    Optional<AiChatSession> findByIdAndUserIdWithMessages(@Param("id") Long id, @Param("userId") Long userId);
}
