package com.launchly.broadcast.scheduler;

import com.launchly.broadcast.entity.BroadcastCampaign;
import com.launchly.broadcast.entity.CampaignStatus;
import com.launchly.broadcast.repository.BroadcastCampaignRepository;
import com.launchly.broadcast.service.BroadcastService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class BroadcastScheduler {

    private final BroadcastCampaignRepository campaignRepository;
    private final BroadcastService broadcastService;

    @Scheduled(fixedDelay = 30000)
    public void processScheduledCampaigns() {
        List<BroadcastCampaign> dueCampaigns = campaignRepository
                .findScheduledCampaigns(LocalDateTime.now());

        if (dueCampaigns.isEmpty()) {
            return;
        }

        log.info("Found {} scheduled campaigns ready for dispatch", dueCampaigns.size());

        for (BroadcastCampaign campaign : dueCampaigns) {
            try {
                broadcastService.sendCampaign(campaign.getId());
                log.info("Dispatched scheduled campaign {} ('{}')", campaign.getId(), campaign.getName());
            } catch (Exception e) {
                log.error("Failed to dispatch scheduled campaign {}: {}",
                        campaign.getId(), e.getMessage(), e);
            }
        }
    }
}
