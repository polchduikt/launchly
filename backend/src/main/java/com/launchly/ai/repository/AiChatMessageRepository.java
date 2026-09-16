package com.launchly.ai.repository;

import com.launchly.ai.entity.AiChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiChatMessageRepository extends JpaRepository<AiChatMessage, Long> {

    List<AiChatMessage> findAllBySessionIdOrderByCreatedAtAsc(Long sessionId);
}
