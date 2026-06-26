package com.launchly.broadcast.service.impl;

import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.service.FlowEngineService;
import com.launchly.bot.service.TelegramSendService;
import com.launchly.broadcast.dto.request.CreateCampaignRequest;
import com.launchly.broadcast.dto.response.CampaignResponse;
import com.launchly.broadcast.entity.BroadcastCampaign;
import com.launchly.broadcast.entity.CampaignStatus;
import com.launchly.broadcast.mapper.BroadcastMapper;
import com.launchly.broadcast.repository.BroadcastCampaignRepository;
import com.launchly.broadcast.service.BroadcastFilterService;
import com.launchly.broadcast.service.BroadcastService;
import com.launchly.billing.service.PlanLimitService;
import com.launchly.common.exception.AppException;
import com.launchly.common.utils.SanitizationUtil;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Lazy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Slf4j
public class BroadcastServiceImpl implements BroadcastService {

    private static final int BATCH_SIZE = 25;
    private static final long BATCH_DELAY_MS = 1000;
    private final BroadcastCampaignRepository campaignRepository;
    private final BotRepository botRepository;
    private final BroadcastFilterService broadcastFilterService;
    private final TelegramSendService telegramSendService;
    private final BroadcastMapper broadcastMapper;
    private final PlanLimitService planLimitService;
    private final ObjectMapper objectMapper;
    private final FlowEngineService flowEngineService;

    public BroadcastServiceImpl(BroadcastCampaignRepository campaignRepository,
                                BotRepository botRepository,
                                BroadcastFilterService broadcastFilterService,
                                TelegramSendService telegramSendService,
                                BroadcastMapper broadcastMapper,
                                PlanLimitService planLimitService,
                                ObjectMapper objectMapper,
                                @Lazy FlowEngineService flowEngineService) {
        this.campaignRepository = campaignRepository;
        this.botRepository = botRepository;
        this.broadcastFilterService = broadcastFilterService;
        this.telegramSendService = telegramSendService;
        this.broadcastMapper = broadcastMapper;
        this.planLimitService = planLimitService;
        this.objectMapper = objectMapper;
        this.flowEngineService = flowEngineService;
    }

    @Override
    @Transactional
    public CampaignResponse createCampaign(Long botId, Long userId, CreateCampaignRequest request) {
        planLimitService.checkBroadcastAccess(userId);
        Bot bot = validateBotOwnership(botId, userId);

        CampaignStatus initialStatus = request.scheduledAt() != null
                ? CampaignStatus.SCHEDULED
                : CampaignStatus.DRAFT;

        String messageText = extractFirstMessageText(request.nodes(), request.edges(), request.message());

        BroadcastCampaign campaign = BroadcastCampaign.builder()
                .name(request.name())
                .message(messageText)
                .status(initialStatus)
                .filterType(request.filterType())
                .filterValue(request.filterValue())
                .scheduledAt(request.scheduledAt())
                .nodes(request.nodes() != null ? request.nodes() : "[]")
                .edges(request.edges() != null ? request.edges() : "[]")
                .bot(bot)
                .build();

        campaign = campaignRepository.save(campaign);
        log.info("Created campaign '{}' (id={}) for botId={} with status={}",
                campaign.getName(), campaign.getId(), botId, initialStatus);
        return broadcastMapper.toCampaignResponse(campaign);
    }

    @Override
    @Transactional
    public CampaignResponse updateCampaign(Long botId, Long campaignId, Long userId, CreateCampaignRequest request) {
        validateBotOwnership(botId, userId);
        BroadcastCampaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Campaign not found"));

        if (!campaign.getBot().getId().equals(botId)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Campaign does not belong to this bot");
        }

        if (campaign.getStatus() == CampaignStatus.IN_PROGRESS
                || campaign.getStatus() == CampaignStatus.COMPLETED) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Cannot update campaign that is already " + campaign.getStatus());
        }

        String messageText = extractFirstMessageText(request.nodes(), request.edges(), request.message());

        campaign.setName(request.name());
        campaign.setMessage(messageText);
        campaign.setFilterType(request.filterType());
        campaign.setFilterValue(request.filterValue());
        campaign.setScheduledAt(request.scheduledAt());
        campaign.setNodes(request.nodes() != null ? request.nodes() : "[]");
        campaign.setEdges(request.edges() != null ? request.edges() : "[]");

        if (request.scheduledAt() != null) {
            campaign.setStatus(CampaignStatus.SCHEDULED);
        } else if (campaign.getStatus() == CampaignStatus.SCHEDULED) {
            campaign.setStatus(CampaignStatus.DRAFT);
        }

        campaign = campaignRepository.save(campaign);
        log.info("Updated campaign '{}' (id={}) for botId={}",
                campaign.getName(), campaign.getId(), botId);
        return broadcastMapper.toCampaignResponse(campaign);
    }

    private String extractFirstMessageText(String nodesJson, String edgesJson, String defaultMessage) {
        if (nodesJson == null || nodesJson.trim().isEmpty() || "[]".equals(nodesJson)) {
            return defaultMessage != null ? defaultMessage : "";
        }
        try {
            JsonNode nodesNode = objectMapper.readTree(nodesJson);
            JsonNode edgesNode = edgesJson != null && !edgesJson.trim().isEmpty() ? objectMapper.readTree(edgesJson) : objectMapper.createArrayNode();
            
            String startNodeId = null;
            for (JsonNode n : nodesNode) {
                if ("START_BROADCAST".equals(n.get("type").asText())) {
                    startNodeId = n.get("id").asText();
                    break;
                }
            }
            
            if (startNodeId == null) {
                return defaultMessage != null ? defaultMessage : "";
            }
            
            String firstConnectedNodeId = null;
            for (JsonNode e : edgesNode) {
                if (startNodeId.equals(e.get("source").asText())) {
                    firstConnectedNodeId = e.get("target").asText();
                    break;
                }
            }
            
            if (firstConnectedNodeId == null) {
                return defaultMessage != null ? defaultMessage : "";
            }
            
            for (JsonNode n : nodesNode) {
                if (firstConnectedNodeId.equals(n.get("id").asText())) {
                    if ("MESSAGE".equals(n.get("type").asText())) {
                        JsonNode data = n.get("data");
                        if (data != null && data.has("text")) {
                            return data.get("text").asText();
                        }
                    }
                    break;
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse campaign flow to extract message: {}", e.getMessage());
        }
        return defaultMessage != null ? defaultMessage : "";
    }

    @Override
    @Transactional(readOnly = true)
    public List<CampaignResponse> getCampaigns(Long botId, Long userId) {
        validateBotOwnership(botId, userId);
        return broadcastMapper.toCampaignResponseList(
                campaignRepository.findByBotIdOrderByCreatedAtDesc(botId)
        );
    }

    @Override
    @Async("broadcastExecutor")
    public void sendCampaign(Long campaignId) {
        BroadcastCampaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Campaign not found"));

        if (campaign.getStatus() == CampaignStatus.IN_PROGRESS
                || campaign.getStatus() == CampaignStatus.COMPLETED) {
            log.warn("Campaign {} is already {} — skipping", campaignId, campaign.getStatus());
            return;
        }

        Long botId = campaign.getBot().getId();
        List<BotUser> targetUsers = broadcastFilterService.filterUsers(
                botId, campaign.getFilterType(), campaign.getFilterValue()
        );

        campaign.setStatus(CampaignStatus.IN_PROGRESS);
        campaign.setTotalCount(targetUsers.size());
        campaign.setSentCount(0);
        campaign.setFailedCount(0);
        campaignRepository.save(campaign);

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
            try {
                if (connectedNodeId != null) {
                    flowEngineService.runFlow(botId, user, connectedNodeId, campaignId);
                } else if (campaign.getMessage() != null && !campaign.getMessage().trim().isEmpty()) {
                    String sanitizedText = SanitizationUtil.sanitizeForTelegram(campaign.getMessage());
                    telegramSendService.sendMessage(botId, user.getTelegramId(), sanitizedText);
                }
                sent++;
            } catch (Exception e) {
                failed++;
                log.error("Failed to execute broadcast for telegramId={}: {}",
                        user.getTelegramId(), e.getMessage());
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

        campaign.setSentCount(sent);
        campaign.setFailedCount(failed);
        campaign.setStatus(failed == targetUsers.size() && !targetUsers.isEmpty()
                ? CampaignStatus.FAILED
                : CampaignStatus.COMPLETED);
        campaignRepository.save(campaign);

        log.info("Broadcast campaign {} completed: sent={}, failed={}, total={}",
                campaignId, sent, failed, targetUsers.size());
    }

    @Override
    @Transactional
    public CampaignResponse sendNow(Long campaignId, Long userId) {
        BroadcastCampaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Campaign not found"));

        validateBotOwnership(campaign.getBot().getId(), userId);

        if (campaign.getStatus() == CampaignStatus.IN_PROGRESS
                || campaign.getStatus() == CampaignStatus.COMPLETED) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Campaign is already " + campaign.getStatus());
        }

        CampaignResponse response = broadcastMapper.toCampaignResponse(campaign);
        sendCampaign(campaignId);
        return response;
    }

    private Bot validateBotOwnership(Long botId, Long userId) {
        return botRepository.findByIdAndUserId(botId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "Bot not found or access denied"));
    }
}
