package com.launchly.broadcast.service.impl;

import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.service.TelegramSendService;
import com.launchly.broadcast.dto.request.CreateCampaignRequest;
import com.launchly.broadcast.dto.response.CampaignResponse;
import com.launchly.broadcast.entity.BroadcastCampaign;
import com.launchly.broadcast.entity.CampaignStatus;
import com.launchly.broadcast.mapper.BroadcastMapper;
import com.launchly.broadcast.repository.BroadcastCampaignRepository;
import com.launchly.broadcast.service.BroadcastFilterService;
import com.launchly.broadcast.service.BroadcastService;
import com.launchly.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BroadcastServiceImpl implements BroadcastService {

    private static final int BATCH_SIZE = 25;
    private static final long BATCH_DELAY_MS = 1000;

    private final BroadcastCampaignRepository campaignRepository;
    private final BotRepository botRepository;
    private final BroadcastFilterService broadcastFilterService;
    private final TelegramSendService telegramSendService;
    private final BroadcastMapper broadcastMapper;

    @Override
    @Transactional
    public CampaignResponse createCampaign(Long botId, Long userId, CreateCampaignRequest request) {
        Bot bot = validateBotOwnership(botId, userId);

        CampaignStatus initialStatus = request.scheduledAt() != null
                ? CampaignStatus.SCHEDULED
                : CampaignStatus.DRAFT;

        BroadcastCampaign campaign = BroadcastCampaign.builder()
                .name(request.name())
                .message(request.message())
                .status(initialStatus)
                .filterType(request.filterType())
                .filterValue(request.filterValue())
                .scheduledAt(request.scheduledAt())
                .bot(bot)
                .build();

        campaign = campaignRepository.save(campaign);
        log.info("Created campaign '{}' (id={}) for botId={} with status={}",
                campaign.getName(), campaign.getId(), botId, initialStatus);
        return broadcastMapper.toCampaignResponse(campaign);
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

        int sent = 0;
        int failed = 0;

        for (int i = 0; i < targetUsers.size(); i++) {
            BotUser user = targetUsers.get(i);
            try {
                telegramSendService.sendMessage(botId, user.getTelegramId(), campaign.getMessage());
                sent++;
            } catch (Exception e) {
                failed++;
                log.error("Failed to send broadcast to telegramId={}: {}",
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
