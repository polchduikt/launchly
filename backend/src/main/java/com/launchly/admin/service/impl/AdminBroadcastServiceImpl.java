package com.launchly.admin.service.impl;

import com.launchly.admin.dto.AdminBroadcastDetailDto;
import com.launchly.admin.dto.AdminBroadcastDto;
import com.launchly.admin.dto.UserActivityDto;
import com.launchly.admin.entity.UserAuditLog;
import com.launchly.admin.repository.UserAuditLogRepository;
import com.launchly.admin.service.AdminBroadcastService;
import com.launchly.admin.service.UserAuditService;
import com.launchly.auth.entity.User;
import com.launchly.bot.entity.Bot;
import com.launchly.broadcast.entity.BroadcastCampaign;
import com.launchly.broadcast.entity.CampaignStatus;
import com.launchly.broadcast.repository.BroadcastCampaignRepository;
import com.launchly.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminBroadcastServiceImpl implements AdminBroadcastService {

    private final BroadcastCampaignRepository broadcastCampaignRepository;
    private final UserAuditLogRepository userAuditLogRepository;
    private final UserAuditService userAuditService;

    @Override
    @Transactional(readOnly = true)
    public Page<AdminBroadcastDto> getBroadcasts(String search, String status, String sort, int page, int size) {
        Sort.Direction direction = "asc".equalsIgnoreCase(sort) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, "createdAt"));
        String statusFilter = (status == null || status.isBlank()) ? "all" : status;
        String searchFilter = (search == null) ? "" : search.trim();

        Page<BroadcastCampaign> campaignPage = broadcastCampaignRepository.findAdminBroadcasts(searchFilter, statusFilter, pageable);

        return campaignPage.map(c -> {
            Bot bot = c.getBot();
            User creator = bot != null ? bot.getUser() : null;
            String email = creator != null ? creator.getEmail() : "system";
            String name = creator != null ? creator.getName() : "System";
            String botName = bot != null ? bot.getName() : null;

            return AdminBroadcastDto.builder()
                    .id(c.getId())
                    .title(c.getName())
                    .content(c.getMessage())
                    .targetAudience(Boolean.TRUE.equals(c.getTargetAllBots()) ? "ALL_USERS" : "SPECIFIC_BOT")
                    .botName(botName)
                    .sentCount(c.getSentCount() != null ? c.getSentCount() : 0)
                    .failedCount(c.getFailedCount() != null ? c.getFailedCount() : 0)
                    .totalCount(c.getTotalCount() != null ? c.getTotalCount() : 0)
                    .status(c.isBlocked() ? "BLOCKED" : (c.getStatus() != null ? c.getStatus().name() : "COMPLETED"))
                    .blocked(c.isBlocked())
                    .blockReason(c.getBlockReason())
                    .blockedAt(c.getBlockedAt())
                    .createdByEmail(email)
                    .authorName(name)
                    .createdAt(c.getCreatedAt() != null ? c.getCreatedAt() : LocalDateTime.now())
                    .build();
        });
    }

    @Override
    @Transactional(readOnly = true)
    public AdminBroadcastDetailDto getBroadcastDetails(Long broadcastId, String period, int page, int size) {
        BroadcastCampaign campaign = broadcastCampaignRepository.findById(broadcastId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Broadcast campaign not found with ID: " + broadcastId));

        Bot bot = campaign.getBot();
        User creator = bot != null ? bot.getUser() : null;
        String email = creator != null ? creator.getEmail() : "system";
        String name = creator != null ? creator.getName() : "System";
        String botName = bot != null ? bot.getName() : null;

        LocalDateTime cutoffDate = getCutoffDate(period);
        Pageable pageable = PageRequest.of(page, size);
        Page<UserAuditLog> logPage = userAuditLogRepository.findBroadcastLogs(broadcastId, cutoffDate, pageable);

        Page<UserActivityDto> activityPage = logPage.map(log -> UserActivityDto.builder()
                .id(log.getId())
                .title(log.getTitle())
                .description(log.getDescription())
                .category(log.getCategory())
                .badge(log.getBadge())
                .timestamp(log.getCreatedAt())
                .build());

        return AdminBroadcastDetailDto.builder()
                .id(campaign.getId())
                .title(campaign.getName())
                .content(campaign.getMessage())
                .targetAudience(Boolean.TRUE.equals(campaign.getTargetAllBots()) ? "ALL_USERS" : "SPECIFIC_BOT")
                .botName(botName)
                .sentCount(campaign.getSentCount() != null ? campaign.getSentCount() : 0)
                .failedCount(campaign.getFailedCount() != null ? campaign.getFailedCount() : 0)
                .totalCount(campaign.getTotalCount() != null ? campaign.getTotalCount() : 0)
                .status(campaign.isBlocked() ? "BLOCKED" : (campaign.getStatus() != null ? campaign.getStatus().name() : "COMPLETED"))
                .blocked(campaign.isBlocked())
                .blockReason(campaign.getBlockReason())
                .blockedAt(campaign.getBlockedAt())
                .createdByEmail(email)
                .authorName(name)
                .authorId(creator != null ? creator.getId() : null)
                .createdAt(campaign.getCreatedAt() != null ? campaign.getCreatedAt() : LocalDateTime.now())
                .scheduledAt(campaign.getScheduledAt())
                .activities(activityPage)
                .build();
    }

    @Override
    @Transactional
    public void cancelBroadcast(Long broadcastId) {
        BroadcastCampaign campaign = broadcastCampaignRepository.findById(broadcastId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Broadcast campaign not found with ID: " + broadcastId));

        if (campaign.isBlocked()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Cannot cancel a blocked broadcast campaign");
        }

        campaign.setStatus(CampaignStatus.CANCELLED);
        broadcastCampaignRepository.save(campaign);

        User creator = campaign.getBot() != null ? campaign.getBot().getUser() : null;
        userAuditService.logBroadcastCancelled(creator, campaign.getId(), campaign.getName());
    }

    @Override
    @Transactional
    public void blockBroadcast(Long broadcastId, String reason) {
        BroadcastCampaign campaign = broadcastCampaignRepository.findById(broadcastId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Broadcast campaign not found with ID: " + broadcastId));

        campaign.setBlocked(true);
        campaign.setBlockReason(reason != null && !reason.isBlank() ? reason.trim() : "Violation of platform rules");
        campaign.setBlockedAt(LocalDateTime.now());
        campaign.setStatus(CampaignStatus.BLOCKED);

        broadcastCampaignRepository.save(campaign);

        User creator = campaign.getBot() != null ? campaign.getBot().getUser() : null;
        userAuditService.logBroadcastBlocked(creator, campaign.getId(), campaign.getName(), campaign.getBlockReason());
    }

    @Override
    @Transactional
    public void unblockBroadcast(Long broadcastId) {
        BroadcastCampaign campaign = broadcastCampaignRepository.findById(broadcastId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Broadcast campaign not found with ID: " + broadcastId));

        campaign.setBlocked(false);
        campaign.setBlockReason(null);
        campaign.setBlockedAt(null);
        campaign.setStatus(CampaignStatus.COMPLETED);

        broadcastCampaignRepository.save(campaign);

        User creator = campaign.getBot() != null ? campaign.getBot().getUser() : null;
        userAuditService.logBroadcastUnblocked(creator, campaign.getId(), campaign.getName());
    }

    private LocalDateTime getCutoffDate(String period) {
        if (period == null) return LocalDateTime.now().minusYears(10);
        return switch (period.toLowerCase()) {
            case "7d" -> LocalDateTime.now().minusDays(7);
            case "30d" -> LocalDateTime.now().minusDays(30);
            case "90d" -> LocalDateTime.now().minusDays(90);
            default -> LocalDateTime.now().minusYears(10);
        };
    }
}
