package com.launchly.broadcast.service.impl;

import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.service.FlowEngineService;
import com.launchly.bot.service.TelegramSendService;
import com.launchly.broadcast.entity.BroadcastCampaign;
import com.launchly.broadcast.entity.CampaignStatus;
import com.launchly.broadcast.repository.BroadcastCampaignRepository;
import com.launchly.broadcast.service.BroadcastExecutionService;
import com.launchly.broadcast.service.BroadcastFilterService;
import com.launchly.common.exception.AppException;
import com.launchly.common.utils.SanitizationUtil;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class BroadcastExecutionServiceImpl implements BroadcastExecutionService {

    private static final int BATCH_SIZE = 25;
    private static final long BATCH_DELAY_MS = 1000;

    private final StringRedisTemplate stringRedisTemplate;
    private final BroadcastCampaignRepository campaignRepository;
    private final BotRepository botRepository;
    private final BroadcastFilterService broadcastFilterService;
    private final ObjectMapper objectMapper;
    private final FlowEngineService flowEngineService;
    private final TelegramSendService telegramSendService;

    public BroadcastExecutionServiceImpl(StringRedisTemplate stringRedisTemplate,
                                         BroadcastCampaignRepository campaignRepository,
                                         BotRepository botRepository,
                                         BroadcastFilterService broadcastFilterService,
                                         ObjectMapper objectMapper,
                                         @Lazy FlowEngineService flowEngineService,
                                         TelegramSendService telegramSendService) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.campaignRepository = campaignRepository;
        this.botRepository = botRepository;
        this.broadcastFilterService = broadcastFilterService;
        this.objectMapper = objectMapper;
        this.flowEngineService = flowEngineService;
        this.telegramSendService = telegramSendService;
    }

    @Override
    @Async("broadcastExecutor")
    public void sendCampaign(Long campaignId) {
        String lockKey = "lock:broadcast:send:" + campaignId;
        Boolean acquired = stringRedisTemplate.opsForValue().setIfAbsent(lockKey, "1", Duration.ofMinutes(10));
        if (Boolean.FALSE.equals(acquired)) {
            log.warn("Broadcast campaign {} is already being dispatched by another process", campaignId);
            return;
        }

        BroadcastCampaign campaign = null;
        try {
            campaign = campaignRepository.findById(campaignId)
                    .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Campaign not found"));

            if (campaign.isBlocked() || campaign.getStatus() == CampaignStatus.BLOCKED) {
                log.warn("Campaign {} is BLOCKED by administrator — skipping execution", campaignId);
                return;
            }

            List<BotUser> targetUsers = new ArrayList<>();
            if (Boolean.TRUE.equals(campaign.getTargetAllBots())) {
                Long ownerId = campaign.getBot().getUser().getId();
                List<Bot> userBots = botRepository.findAllAccessibleByUserId(ownerId);
                for (Bot b : userBots) {
                    targetUsers.addAll(broadcastFilterService.filterUsers(
                            b.getId(), campaign.getFilterType(), campaign.getFilterValue()
                    ));
                }
            } else {
                Long botId = campaign.getBot().getId();
                targetUsers.addAll(broadcastFilterService.filterUsers(
                        botId, campaign.getFilterType(), campaign.getFilterValue()
                    ));
            }

            int previousSent = campaign.getSentCount();
            int previousFailed = campaign.getFailedCount();
            int previousTotal = campaign.getTotalCount();

            campaign.setStatus(CampaignStatus.IN_PROGRESS);
            campaign.setTotalCount(previousTotal + targetUsers.size());
            campaign = campaignRepository.save(campaign);

            log.info("Starting broadcast campaign {} to {} users", campaignId, targetUsers.size());
            String firstConnectedNodeId = null;
            try {
                String nodesJson = campaign.getNodes();
                String edgesJson = campaign.getEdges();
                if (nodesJson != null && !nodesJson.trim().isEmpty() && !"[]".equals(nodesJson)) {
                    JsonNode nodesNode = objectMapper.readTree(nodesJson);
                    JsonNode edgesNode = edgesJson != null && !edgesJson.trim().isEmpty() ? objectMapper.readTree(edgesJson) : objectMapper.createArrayNode();

                    String startNodeId = null;
                    for (JsonNode n : nodesNode) {
                        if ("START_BROADCAST".equals(n.get("type").asText())) {
                            startNodeId = n.get("id").asText();
                            break;
                        }
                    }

                    if (startNodeId != null) {
                        for (JsonNode e : edgesNode) {
                            if (startNodeId.equals(e.get("source").asText())) {
                                firstConnectedNodeId = e.get("target").asText();
                                break;
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Failed to parse campaign flow for dispatching: {}", e.getMessage());
            }

            final String connectedNodeId = firstConnectedNodeId;

            int sent = 0;
            int failed = 0;

            for (int i = 0; i < targetUsers.size(); i++) {
                BotUser user = targetUsers.get(i);
                Long userBotId = user.getBot().getId();
                try {
                    if (connectedNodeId != null) {
                        flowEngineService.runFlow(userBotId, user, connectedNodeId, campaignId);
                    } else if (campaign.getMessage() != null && !campaign.getMessage().trim().isEmpty()) {
                        String sanitizedText = SanitizationUtil.sanitizeForTelegram(campaign.getMessage());
                        telegramSendService.sendMessage(userBotId, user.getTelegramId(), sanitizedText);
                    }
                    sent++;
                } catch (Exception e) {
                    failed++;
                    log.error("Failed to execute broadcast for telegramId={} on botId={}: {}",
                            user.getTelegramId(), userBotId, e.getMessage());
                }

                if ((i + 1) % BATCH_SIZE == 0 && i + 1 < targetUsers.size()) {
                    try {
                        Thread.sleep(BATCH_DELAY_MS);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        log.error("Broadcast campaign {} interrupted", campaignId);
                        break;
                    }
                }
            }

            BroadcastCampaign freshCampaign = campaignRepository.findById(campaignId).orElse(campaign);
            if (freshCampaign != null) {
                int totalSent = previousSent + sent;
                int totalFailed = previousFailed + failed;
                int totalCount = previousTotal + targetUsers.size();
                freshCampaign.setSentCount(totalSent);
                freshCampaign.setFailedCount(totalFailed);
                freshCampaign.setTotalCount(totalCount);
                freshCampaign.setStatus(totalFailed == totalCount && totalCount > 0
                        ? CampaignStatus.FAILED
                        : CampaignStatus.COMPLETED);
                campaignRepository.save(freshCampaign);

                log.info("Broadcast campaign {} completed: sent={}, failed={}, total={}",
                        campaignId, totalSent, totalFailed, totalCount);
            }
        } catch (Exception fatalEx) {
            log.error("Fatal error during broadcast campaign {} execution: {}", campaignId, fatalEx.getMessage(), fatalEx);
            try {
                campaignRepository.findById(campaignId).ifPresent(c -> {
                    c.setStatus(CampaignStatus.FAILED);
                    campaignRepository.save(c);
                });
            } catch (Exception ex) {
                log.error("Failed to set campaign {} to FAILED: {}", campaignId, ex.getMessage());
            }
        } finally {
            stringRedisTemplate.delete(lockKey);
        }
    }
}
