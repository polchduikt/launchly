package com.launchly.broadcast.service.impl;

import com.launchly.bot.entity.Bot;
import com.launchly.bot.repository.BotRepository;
import com.launchly.broadcast.dto.request.CreateCampaignRequest;
import com.launchly.broadcast.dto.response.CampaignResponse;
import com.launchly.broadcast.entity.BroadcastCampaign;
import com.launchly.broadcast.entity.CampaignStatus;
import com.launchly.broadcast.mapper.BroadcastMapper;
import com.launchly.broadcast.repository.BroadcastCampaignRepository;
import com.launchly.broadcast.service.BroadcastExecutionService;
import com.launchly.broadcast.service.BroadcastFilterService;
import com.launchly.broadcast.service.BroadcastService;
import com.launchly.broadcast.util.BroadcastUtils;
import com.launchly.broadcast.validator.BroadcastValidator;
import com.launchly.billing.service.PlanLimitService;
import com.launchly.common.exception.AppException;
import tools.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;
import com.launchly.admin.service.UserAuditService;
import org.springframework.data.redis.core.StringRedisTemplate;
import java.time.LocalDateTime;

@Service
@Slf4j
public class BroadcastServiceImpl implements BroadcastService {

    private static final int BATCH_SIZE = 25;
    private static final long BATCH_DELAY_MS = 1000;
    private final BroadcastCampaignRepository campaignRepository;
    private final BroadcastFilterService broadcastFilterService;
    private final BroadcastMapper broadcastMapper;
    private final PlanLimitService planLimitService;
    private final ObjectMapper objectMapper;
    private final UserAuditService userAuditService;
    private final BroadcastValidator broadcastValidator;
    private final BroadcastExecutionService broadcastExecutionService;
    private final BotRepository botRepository;
    private final StringRedisTemplate stringRedisTemplate;

    public BroadcastServiceImpl(BroadcastCampaignRepository campaignRepository,
                                BroadcastFilterService broadcastFilterService,
                                BroadcastMapper broadcastMapper,
                                PlanLimitService planLimitService,
                                ObjectMapper objectMapper,
                                UserAuditService userAuditService,
                                BroadcastValidator broadcastValidator,
                                BotRepository botRepository,
                                StringRedisTemplate stringRedisTemplate,
                                BroadcastExecutionService broadcastExecutionService) {
        this.campaignRepository = campaignRepository;
        this.broadcastFilterService = broadcastFilterService;
        this.broadcastMapper = broadcastMapper;
        this.planLimitService = planLimitService;
        this.objectMapper = objectMapper;
        this.userAuditService = userAuditService;
        this.broadcastValidator = broadcastValidator;
        this.botRepository = botRepository;
        this.stringRedisTemplate = stringRedisTemplate;
        this.broadcastExecutionService = broadcastExecutionService;
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
    @Transactional
    public CampaignResponse sendNow(Long campaignId, Long userId) {
        BroadcastCampaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "broadcast.error.not_found"));

        if (campaign.isBlocked() || campaign.getStatus() == CampaignStatus.BLOCKED) {
            throw new AppException(HttpStatus.FORBIDDEN, "broadcast.error.blocked");
        }

        broadcastValidator.validateWriteAccess(campaign.getBot().getId(), userId);

        if (campaign.getStatus() == CampaignStatus.IN_PROGRESS) {
            String lockKey = "lock:broadcast:send:" + campaignId;
            Boolean hasLock = stringRedisTemplate.hasKey(lockKey);
            if (Boolean.TRUE.equals(hasLock)) {
                throw new AppException(HttpStatus.BAD_REQUEST, "broadcast.error.already_in_progress");
            }
        }

        userAuditService.logBroadcastLaunched(campaign.getBot().getUser(), campaign.getId(), campaign.getName(), "FINISHED", LocalDateTime.now());
        CampaignResponse response = toResponse(campaign);
        broadcastExecutionService.sendCampaign(campaignId);
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

    @Override
    @Transactional(readOnly = true)
    public CampaignResponse getCampaign(Long campaignId) {
        BroadcastCampaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "broadcast.error.not_found"));
        return toResponse(campaign);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isCampaignBlocked(Long campaignId) {
        return campaignRepository.findById(campaignId)
                .map(c -> c.isBlocked() || c.getStatus() == CampaignStatus.BLOCKED)
                .orElse(false);
    }
}
