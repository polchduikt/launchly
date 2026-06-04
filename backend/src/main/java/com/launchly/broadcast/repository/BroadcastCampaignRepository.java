package com.launchly.broadcast.repository;

import com.launchly.broadcast.entity.BroadcastCampaign;
import com.launchly.broadcast.entity.CampaignStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface BroadcastCampaignRepository extends JpaRepository<BroadcastCampaign, Long> {

    List<BroadcastCampaign> findByBotIdOrderByCreatedAtDesc(Long botId);

    List<BroadcastCampaign> findByStatusAndScheduledAtBefore(CampaignStatus status, LocalDateTime dateTime);
}
