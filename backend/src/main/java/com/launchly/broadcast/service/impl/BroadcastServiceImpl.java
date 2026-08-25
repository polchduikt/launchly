package com.launchly.broadcast.service.impl;

import com.launchly.auth.entity.User;
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
import com.launchly.broadcast.util.BroadcastUtils;
import com.launchly.broadcast.validator.BroadcastValidator;
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
import java.util.stream.Collectors;
import com.launchly.bot.repository.BotMemberRepository;
import com.launchly.bot.entity.BotMember;
import com.launchly.admin.service.UserAuditService;
import org.springframework.data.redis.core.StringRedisTemplate;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
@Slf4j
public class BroadcastServiceImpl implements BroadcastService {

    private static final int BATCH_SIZE = 25;
    private static final long BATCH_DELAY_MS = 1000;
    private final BroadcastCampaignRepository campaignRepository;
    private final BroadcastFilterService broadcastFilterService;
    private final TelegramSendService telegramSendService;
    private final BroadcastMapper broadcastMapper;
    private final PlanLimitService planLimitService;
    private final ObjectMapper objectMapper;
    private final FlowEngineService flowEngineService;
    private final UserAuditService userAuditService;
    private final BroadcastValidator broadcastValidator;
    private final BotRepository botRepository;
    private final BotMemberRepository botMemberRepository;
    private final StringRedisTemplate stringRedisTemplate;

    public BroadcastServiceImpl(BroadcastCampaignRepository campaignRepository,
                                BroadcastFilterService broadcastFilterService,
                                TelegramSendService telegramSendService,
                                BroadcastMapper broadcastMapper,
                                PlanLimitService planLimitService,
                                ObjectMapper objectMapper,
                                @Lazy FlowEngineService flowEngineService,
                                UserAuditService userAuditService,
                                BroadcastValidator broadcastValidator,
                                BotRepository botRepository,
                                BotMemberRepository botMemberRepository,
                                StringRedisTemplate stringRedisTemplate) {
        this.campaignRepository = campaignRepository;
        this.broadcastFilterService = broadcastFilterService;
        this.telegramSendService = telegramSendService;
        this.broadcastMapper = broadcastMapper;
        this.planLimitService = planLimitService;
        this.objectMapper = objectMapper;
        this.flowEngineService = flowEngineService;
        this.userAuditService = userAuditService;
        this.broadcastValidator = broadcastValidator;
        this.botRepository = botRepository;
        this.botMemberRepository = botMemberRepository;
        this.stringRedisTemplate = stringRedisTemplate;
    }

    @Override
    @Transactional
    public CampaignResponse createCampaign(Long botId, Long userId, CreateCampaignRequest request) {
        planLimitService.checkBroadcastAccess(userId);
        broadcastValidator.validateWriteAccess(botId, userId);
        Bot bot = broadcastValidator.validateBotOwnership(botId, userId);

        broadcastValidator.validateScheduledAt(request.scheduledAt());

        CampaignStatus initialStatus = request.scheduledAt() != null
                ? CampaignStatus.SCHEDULED
                : CampaignStatus.DRAFT;

        String messageText = BroadcastUtils.extractFirstMessageText(request.nodes(), request.edges(), request.message());

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
        return toResponse(campaign);
    }

    @Override
    @Transactional
    public CampaignResponse updateCampaign(Long botId, Long campaignId, Long userId, CreateCampaignRequest request) {
        broadcastValidator.validateWriteAccess(botId, userId);
        broadcastValidator.validateBotOwnership(botId, userId);
        BroadcastCampaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "broadcast.error.not_found"));

        if (campaign.isBlocked() || campaign.getStatus() == CampaignStatus.BLOCKED) {
            throw new AppException(HttpStatus.FORBIDDEN, "broadcast.error.blocked");
        }

        if (!campaign.getBot().getId().equals(botId)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "broadcast.error.not_belong_to_bot");
        }

        if (request.botId() != null && !request.botId().equals(campaign.getBot().getId())) {
            broadcastValidator.validateWriteAccess(request.botId(), userId);
            broadcastValidator.validateBotOwnership(request.botId(), userId);
            Bot newBot = botRepository.findById(request.botId())
                    .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "bot.error.not_found"));
            campaign.setBot(newBot);
        }


        String messageText = BroadcastUtils.extractFirstMessageText(request.nodes(), request.edges(), request.message());

        campaign.setName(request.name());
        campaign.setMessage(messageText);
        campaign.setFilterType(request.filterType());
        campaign.setFilterValue(request.filterValue());
        
        if (request.scheduledAt() != null) {
            broadcastValidator.validateScheduledAt(request.scheduledAt());
            campaign.setScheduledAt(request.scheduledAt());
            campaign.setStatus(CampaignStatus.SCHEDULED);
        }


        campaign.setTargetAllBots(request.targetAllBots() != null ? request.targetAllBots() : false);
        campaign.setNodes(request.nodes() != null ? request.nodes() : "[]");
        campaign.setEdges(request.edges() != null ? request.edges() : "[]");

        campaign = campaignRepository.save(campaign);
        log.info("Updated campaign '{}' (id={}) for botId={}",
                campaign.getName(), campaign.getId(), botId);
        return toResponse(campaign);
    }


    @Override
    @Transactional(readOnly = true)
    public List<CampaignResponse> getCampaigns(Long botId, Long userId) {
        broadcastValidator.validateBotOwnership(botId, userId);
        List<BroadcastCampaign> list = campaignRepository.findByBotIdOrderByCreatedAtDesc(botId);
        return list.stream().map(this::toResponse).collect(Collectors.toList());
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
                    User owner = bm.getBot().getUser();
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
            campaign = campaignRepository.save(campaign);

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

            BroadcastCampaign freshCampaign = campaignRepository.findById(campaignId).orElse(campaign);
            if (freshCampaign != null) {
                freshCampaign.setSentCount(previousSent + sent);
                freshCampaign.setFailedCount(previousFailed + failed);
                int totalSent = previousSent + sent;
                int totalFailed = previousFailed + failed;
                int totalCount = freshCampaign.getTotalCount();
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


    @Override
    @Transactional
    public CampaignResponse sendNow(Long campaignId, Long userId) {
        BroadcastCampaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "broadcast.error.not_found"));

        if (campaign.isBlocked() || campaign.getStatus() == CampaignStatus.BLOCKED) {
            throw new AppException(HttpStatus.FORBIDDEN, "broadcast.error.blocked");
        }

        broadcastValidator.validateWriteAccess(campaign.getBot().getId(), userId);

        if (campaign.getStatus() == CampaignStatus.IN_PROGRESS) {
            throw new AppException(HttpStatus.BAD_REQUEST, "broadcast.error.already_in_progress");
        }

        userAuditService.logBroadcastLaunched(campaign.getBot().getUser(), campaign.getId(), campaign.getName(), "FINISHED", LocalDateTime.now());
        CampaignResponse response = toResponse(campaign);
        sendCampaign(campaignId);
        return response;
    }

    @Override
    @Transactional
    public CampaignResponse cancelSchedule(Long campaignId, Long userId) {
        BroadcastCampaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "broadcast.error.not_found"));

        if (campaign.isBlocked() || campaign.getStatus() == CampaignStatus.BLOCKED) {
            throw new AppException(HttpStatus.FORBIDDEN, "broadcast.error.blocked");
        }

        broadcastValidator.validateWriteAccess(campaign.getBot().getId(), userId);

        if (campaign.getStatus() != CampaignStatus.SCHEDULED) {
            throw new AppException(HttpStatus.BAD_REQUEST, "broadcast.error.not_scheduled");
        }


        campaign.setStatus(CampaignStatus.DRAFT);
        campaign.setScheduledAt(null);
        campaignRepository.save(campaign);
        log.info("Cancelled schedule for campaignId={} userId={}", campaignId, userId);
        return toResponse(campaign);
    }

    @Override
    @Transactional
    public void deleteCampaign(Long campaignId, Long userId) {
        BroadcastCampaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Campaign not found"));

        broadcastValidator.validateWriteAccess(campaign.getBot().getId(), userId);

        campaignRepository.delete(campaign);
        log.info("Deleted campaignId={} for userId={}", campaignId, userId);
    }

    private CampaignResponse toResponse(BroadcastCampaign campaign) {
        return new CampaignResponse(
                campaign.getId(),
                campaign.getName(),
                campaign.getMessage(),
                campaign.isBlocked() ? CampaignStatus.BLOCKED : campaign.getStatus(),
                campaign.isBlocked(),
                campaign.getBlockReason(),
                campaign.getBlockedAt(),
                campaign.getFilterType(),
                campaign.getFilterValue(),
                campaign.getScheduledAt(),
                campaign.getSentCount(),
                campaign.getFailedCount(),
                campaign.getTotalCount(),
                campaign.getBot().getId(),
                campaign.getNodes(),
                campaign.getEdges(),
                campaign.getTargetAllBots(),
                campaign.getTemplateName(),
                campaign.getCreatedAt(),
                campaign.getUpdatedAt()
        );
    }
}

