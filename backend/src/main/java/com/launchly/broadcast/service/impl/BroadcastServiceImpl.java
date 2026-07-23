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
import java.util.ArrayList;
import com.launchly.bot.repository.BotMemberRepository;
import com.launchly.bot.entity.BotMember;

import com.launchly.admin.service.UserAuditService;
import java.time.LocalDateTime;

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
    private final BotMemberRepository botMemberRepository;
    private final UserAuditService userAuditService;

    public BroadcastServiceImpl(BroadcastCampaignRepository campaignRepository,
                                BotRepository botRepository,
                                BroadcastFilterService broadcastFilterService,
                                TelegramSendService telegramSendService,
                                BroadcastMapper broadcastMapper,
                                PlanLimitService planLimitService,
                                ObjectMapper objectMapper,
                                @Lazy FlowEngineService flowEngineService,
                                BotMemberRepository botMemberRepository,
                                UserAuditService userAuditService) {
        this.campaignRepository = campaignRepository;
        this.botRepository = botRepository;
        this.broadcastFilterService = broadcastFilterService;
        this.telegramSendService = telegramSendService;
        this.broadcastMapper = broadcastMapper;
        this.planLimitService = planLimitService;
        this.objectMapper = objectMapper;
        this.flowEngineService = flowEngineService;
        this.botMemberRepository = botMemberRepository;
        this.userAuditService = userAuditService;
    }

    @Override
    @Transactional
    public CampaignResponse createCampaign(Long botId, Long userId, CreateCampaignRequest request) {
        planLimitService.checkBroadcastAccess(userId);
        validateWriteAccess(botId, userId);
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
                .targetAllBots(request.targetAllBots() != null ? request.targetAllBots() : false)
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
        validateWriteAccess(botId, userId);
        validateBotOwnership(botId, userId);
        BroadcastCampaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Campaign not found"));

        if (!campaign.getBot().getId().equals(botId)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Campaign does not belong to this bot");
        }

        if (request.botId() != null && !request.botId().equals(campaign.getBot().getId())) {
            validateWriteAccess(request.botId(), userId);
            validateBotOwnership(request.botId(), userId);
            Bot newBot = botRepository.findById(request.botId())
                    .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "New bot not found"));
            campaign.setBot(newBot);
        }

        String messageText = extractFirstMessageText(request.nodes(), request.edges(), request.message());

        campaign.setName(request.name());
        campaign.setMessage(messageText);
        campaign.setFilterType(request.filterType());
        campaign.setFilterValue(request.filterValue());
        campaign.setScheduledAt(request.scheduledAt());
        campaign.setTargetAllBots(request.targetAllBots() != null ? request.targetAllBots() : false);
        campaign.setNodes(request.nodes() != null ? request.nodes() : "[]");
        campaign.setEdges(request.edges() != null ? request.edges() : "[]");

        if (campaign.getStatus() == CampaignStatus.DRAFT || campaign.getStatus() == CampaignStatus.SCHEDULED) {
            if (request.scheduledAt() != null) {
                campaign.setStatus(CampaignStatus.SCHEDULED);
            } else {
                campaign.setStatus(CampaignStatus.DRAFT);
            }
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

        if (campaign.getStatus() == CampaignStatus.IN_PROGRESS) {
            log.warn("Campaign {} is already IN_PROGRESS — skipping", campaignId);
            return;
        }

        List<BotUser> targetUsers = new ArrayList<>();
        if (Boolean.TRUE.equals(campaign.getTargetAllBots())) {
            Long ownerId = campaign.getBot().getUser().getId();
            List<Bot> userBots = new ArrayList<>(botRepository.findAllByUserId(ownerId));
            List<BotMember> memberships = botMemberRepository.findByUserId(ownerId);
            for (BotMember bm : memberships) {
                com.launchly.auth.entity.User owner = bm.getBot().getUser();
                List<Bot> ownerBots = botRepository.findAllByUserId(owner.getId());
                for (Bot b : ownerBots) {
                    if (userBots.stream().noneMatch(existing -> existing.getId().equals(b.getId()))) {
                        userBots.add(b);
                    }
                }
            }
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

        campaign.setStatus(CampaignStatus.IN_PROGRESS);
        campaign.setTotalCount(campaign.getTotalCount() + targetUsers.size());
        campaignRepository.save(campaign);

        int previousSent = campaign.getSentCount();
        int previousFailed = campaign.getFailedCount();

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

        campaign.setSentCount(previousSent + sent);
        campaign.setFailedCount(previousFailed + failed);
        int totalSent = previousSent + sent;
        int totalFailed = previousFailed + failed;
        int totalCount = campaign.getTotalCount();
        campaign.setStatus(totalFailed == totalCount && totalCount > 0
                ? CampaignStatus.FAILED
                : CampaignStatus.COMPLETED);
        campaignRepository.save(campaign);

        log.info("Broadcast campaign {} completed: sent={}, failed={}, total={}",
                campaignId, totalSent, totalFailed, totalCount);
    }

    @Override
    @Transactional
    public CampaignResponse sendNow(Long campaignId, Long userId) {
        BroadcastCampaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Campaign not found"));

        validateWriteAccess(campaign.getBot().getId(), userId);

        if (campaign.getStatus() == CampaignStatus.IN_PROGRESS) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Campaign is already IN_PROGRESS, please wait for it to complete.");
        }

        userAuditService.logBroadcastLaunched(campaign.getBot().getUser(), campaign.getId(), campaign.getName(), "FINISHED", LocalDateTime.now());
        CampaignResponse response = broadcastMapper.toCampaignResponse(campaign);
        sendCampaign(campaignId);
        return response;
    }

    @Override
    @Transactional
    public CampaignResponse cancelSchedule(Long campaignId, Long userId) {
        BroadcastCampaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Campaign not found"));

        validateWriteAccess(campaign.getBot().getId(), userId);

        if (campaign.getStatus() != CampaignStatus.SCHEDULED) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Campaign is not in SCHEDULED state.");
        }

        campaign.setStatus(CampaignStatus.DRAFT);
        campaign.setScheduledAt(null);
        campaignRepository.save(campaign);
        log.info("Cancelled schedule for campaignId={} userId={}", campaignId, userId);
        return broadcastMapper.toCampaignResponse(campaign);
    }

    @Override
    @Transactional
    public void deleteCampaign(Long campaignId, Long userId) {
        BroadcastCampaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Campaign not found"));

        validateWriteAccess(campaign.getBot().getId(), userId);

        campaignRepository.delete(campaign);
        log.info("Deleted campaignId={} for userId={}", campaignId, userId);
    }

    private Bot validateBotOwnership(Long botId, Long userId) {
        return botRepository.findByIdAndUserId(botId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "Bot not found or access denied"));
    }

    private void validateWriteAccess(Long botId, Long userId) {
        Bot bot = validateBotOwnership(botId, userId);
        if (!bot.getUser().getId().equals(userId)) {
            BotMember member = botMemberRepository.findWorkspaceMemberships(botId, userId).stream().findFirst()
                    .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "Access denied"));
            if ("Viewer".equalsIgnoreCase(member.getRole())) {
                throw new AppException(HttpStatus.FORBIDDEN, "Viewer role cannot modify campaigns");
            }
        }
    }
}
