package com.launchly.crm.repository;

import com.launchly.crm.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    List<Conversation> findByBotIdOrderByUpdatedAtDesc(Long botId);

    List<Conversation> findByBotUserIdOrderByUpdatedAtDesc(Long userId);

    Optional<Conversation> findByBotIdAndBotUserId(Long botId, Long botUserId);
}
