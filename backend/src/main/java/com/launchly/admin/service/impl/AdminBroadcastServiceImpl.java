package com.launchly.admin.service.impl;

import com.launchly.admin.dto.AdminBroadcastDetailDto;
import com.launchly.admin.dto.AdminBroadcastDto;
import com.launchly.admin.dto.AdminBlockRequest;
import com.launchly.admin.dto.UserActivityDto;
import com.launchly.admin.entity.UserAuditLog;
import com.launchly.admin.mapper.AdminMapper;
import com.launchly.admin.repository.UserAuditLogRepository;
import com.launchly.admin.service.AdminBroadcastService;
import com.launchly.admin.service.UserAuditService;
import com.launchly.admin.util.AdminPeriodResolver;
import com.launchly.auth.entity.User;
import com.launchly.bot.entity.Bot;
import com.launchly.broadcast.entity.BroadcastCampaign;
import com.launchly.broadcast.entity.CampaignStatus;
import com.launchly.broadcast.repository.BroadcastCampaignRepository;
import com.launchly.common.exception.AppException;
import com.launchly.common.utils.MessageUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminBroadcastServiceImpl implements AdminBroadcastService {

    private final BroadcastCampaignRepository broadcastCampaignRepository;
    private final UserAuditLogRepository userAuditLogRepository;
    private final UserAuditService userAuditService;
    private final AdminPeriodResolver periodResolver;
    private final AdminMapper adminMapper;
    private final MessageUtils messageUtils;

    @Override
    @Transactional(readOnly = true)
    public Page<AdminBroadcastDto> getBroadcasts(String search, String status, String sort, int page, int size) {
        Sort.Direction direction = "asc".equalsIgnoreCase(sort) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, "createdAt"));
        String statusFilter = (status == null || status.isBlank()) ? "all" : status;
        String searchFilter = (search == null) ? "" : search.trim();

        Page<BroadcastCampaign> campaignPage = broadcastCampaignRepository.findAdminBroadcasts(searchFilter, statusFilter, pageable);

        return campaignPage.map(this::mapToListDto);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminBroadcastDetailDto getBroadcastDetails(Long broadcastId, String period, int page, int size) {
        BroadcastCampaign campaign = findCampaignOrThrow(broadcastId);

        Bot bot = campaign.getBot();
        User creator = bot != null ? bot.getUser() : null;

        LocalDateTime cutoffDate = periodResolver.resolve(period);
        Pageable pageable = PageRequest.of(page, size);
        Page<UserAuditLog> logPage = userAuditLogRepository.findBroadcastLogs(broadcastId, cutoffDate, pageable);

        Page<UserActivityDto> activityPage = logPage.map(log -> UserActivityDto.builder()
                .id(log.getId())
                .targetId(log.getTargetId())
                .targetName(log.getTargetName())
                .title(log.getTitle())
                .description(log.getDescription())
                .category(log.getCategory())
                .badge(log.getBadge())
                .timestamp(log.getCreatedAt())
                .build());

        return adminMapper.toBroadcastDetailDto(campaign, creator, messageUtils.getMessage("admin.support_team"), activityPage);
    }

    @Override
    @Transactional
    public void cancelBroadcast(Long broadcastId) {
        BroadcastCampaign campaign = findCampaignOrThrow(broadcastId);

        if (campaign.isBlocked()) {
            throw new AppException(HttpStatus.BAD_REQUEST, messageUtils.getMessage("admin.support.dialog_closed_err"));
        }

        campaign.cancel();
        broadcastCampaignRepository.save(campaign);

        User creator = campaign.getBot() != null ? campaign.getBot().getUser() : null;
        userAuditService.logBroadcastCancelled(creator, campaign.getId(), campaign.getName());
    }

    @Override
    @Transactional
    public void blockBroadcast(Long broadcastId, AdminBlockRequest request) {
        BroadcastCampaign campaign = findCampaignOrThrow(broadcastId);
        String reason = request != null ? request.getReason() : null;
        String fullReason = (reason != null && !reason.isBlank()) ? reason.trim() : messageUtils.getMessage("admin.reason_rules");

        campaign.block(fullReason);
        broadcastCampaignRepository.save(campaign);

        User creator = campaign.getBot() != null ? campaign.getBot().getUser() : null;
        userAuditService.logBroadcastBlocked(creator, campaign.getId(), campaign.getName(), campaign.getBlockReason());
    }

    @Override
    @Transactional
    public void unblockBroadcast(Long broadcastId) {
        BroadcastCampaign campaign = findCampaignOrThrow(broadcastId);

        campaign.unblock();
        broadcastCampaignRepository.save(campaign);

        User creator = campaign.getBot() != null ? campaign.getBot().getUser() : null;
        userAuditService.logBroadcastUnblocked(creator, campaign.getId(), campaign.getName());
    }

    private BroadcastCampaign findCampaignOrThrow(Long id) {
        return broadcastCampaignRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, messageUtils.getMessage("common.error.not_found")));
    }

    private AdminBroadcastDto mapToListDto(BroadcastCampaign c) {
        User creator = c.getBot() != null ? c.getBot().getUser() : null;
        return adminMapper.toBroadcastDto(c, creator, messageUtils.getMessage("admin.support_team"));
    }
}

