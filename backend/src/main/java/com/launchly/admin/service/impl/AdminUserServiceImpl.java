package com.launchly.admin.service.impl;

import com.launchly.admin.dto.AdminUserDetailDto;
import com.launchly.admin.dto.AdminUserDto;
import com.launchly.admin.dto.AdminBlockRequest;
import com.launchly.admin.dto.UserActivityDto;
import com.launchly.admin.dto.UserAutomationSummaryDto;
import com.launchly.admin.dto.UserBroadcastSummaryDto;
import com.launchly.admin.entity.UserAuditLog;
import com.launchly.admin.mapper.AdminMapper;
import com.launchly.admin.repository.UserAuditLogRepository;
import com.launchly.admin.service.AdminUserService;
import com.launchly.admin.service.UserAuditService;
import com.launchly.admin.util.AdminFilterUtils;
import com.launchly.admin.util.AdminPeriodResolver;
import com.launchly.admin.validator.BotTokenValidator;
import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import com.launchly.auth.service.UserQueryService;
import com.launchly.billing.repository.SubscriptionRepository;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.repository.FlowSchemaRepository;
import com.launchly.broadcast.repository.BroadcastCampaignRepository;
import com.launchly.common.exception.AppException;
import com.launchly.common.utils.MessageUtils;
import com.launchly.crm.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserQueryService userQueryService;
    private final BotRepository botRepository;
    private final FlowSchemaRepository flowSchemaRepository;
    private final BroadcastCampaignRepository broadcastCampaignRepository;
    private final BotUserRepository botUserRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UserAuditLogRepository userAuditLogRepository;
    private final UserAuditService userAuditService;
    private final ConversationRepository conversationRepository;
    private final BotTokenValidator botTokenValidator;
    private final AdminPeriodResolver periodResolver;
    private final AdminMapper adminMapper;
    private final MessageUtils messageUtils;

    @Override
    @Transactional
    public AdminUserDetailDto getUserDetails(Long userId, String period, String category, int page, int size) {
        User user = userQueryService.getUserOrThrow(userId);

        LocalDateTime cutoff = periodResolver.resolve(period);

        List<Bot> userBots = botRepository.findByUserId(userId);
        long botsCount = userBots.size();
        long automationsCount = flowSchemaRepository.countByUserId(userId);
        long broadcastsCount = broadcastCampaignRepository.countByUserId(userId);

        long contactsCount = userBots.stream()
                .mapToLong(b -> botUserRepository.countByBotId(b.getId()))
                .sum();

        String planName = subscriptionRepository.findByUserId(userId)
                .map(sub -> sub.getPlan() != null ? sub.getPlan().getName() : "FREE")
                .orElse("FREE");

        LocalDateTime lastActivity = userBots.stream()
                .map(b -> b.getUpdatedAt() != null ? b.getUpdatedAt() : b.getCreatedAt())
                .max(LocalDateTime::compareTo)
                .orElse(user.getUpdatedAt() != null ? user.getUpdatedAt() : user.getCreatedAt());

        Page<UserAuditLog> logPage = userAuditLogRepository.findUserLogs(
                userId,
                category != null ? category : "all",
                cutoff,
                PageRequest.of(page, size)
        );

        Page<UserActivityDto> activityPage = logPage.map(adminMapper::toActivityDto);

        List<UserAutomationSummaryDto> userAutomations = flowSchemaRepository.findAllByUserId(userId).stream()
                .map(f -> {
                    Bot bot = f.getBot();
                    boolean connected = botTokenValidator.isConnected(bot);
                    long execCount = (bot != null && connected) ? conversationRepository.countByBotId(bot.getId()) : 0;
                    int runs = connected ? Math.max((int) execCount, f.getVersion()) : 0;
                    return adminMapper.toAutomationSummaryDto(f, botTokenValidator.resolveBotName(bot), connected, runs);
                })
                .collect(Collectors.toList());

        List<UserBroadcastSummaryDto> userBroadcasts = userBots.stream()
                .flatMap(b -> broadcastCampaignRepository.findByBotIdOrderByCreatedAtDesc(b.getId()).stream())
                .map(adminMapper::toBroadcastSummaryDto)
                .collect(Collectors.toList());

        return adminMapper.toUserDetailDto(
                user,
                botsCount,
                automationsCount,
                broadcastsCount,
                contactsCount,
                planName,
                lastActivity,
                activityPage,
                userAutomations,
                userBroadcasts
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserDto> getUsers(String search, Role roleFilter, String planFilter, String sort, int page, int size) {
        List<User> allUsers = userQueryService.findAllUsers();

        List<AdminUserDto> filtered = allUsers.stream()
                .filter(u -> AdminFilterUtils.matchesRole(u, roleFilter))
                .filter(u -> AdminFilterUtils.matchesSearch(u, search))
                .filter(u -> {
                    String pName = subscriptionRepository.findByUserId(u.getId())
                            .map(sub -> sub.getPlan() != null ? sub.getPlan().getName() : "FREE")
                            .orElse("FREE");
                    return AdminFilterUtils.matchesPlan(pName, planFilter);
                })
                .map(this::mapToUserDto)
                .collect(Collectors.toList());

        filtered.sort((a, b) -> {
            LocalDateTime t1 = a.getCreatedAt() != null ? a.getCreatedAt() : LocalDateTime.MIN;
            LocalDateTime t2 = b.getCreatedAt() != null ? b.getCreatedAt() : LocalDateTime.MIN;
            return "asc".equalsIgnoreCase(sort) ? t1.compareTo(t2) : t2.compareTo(t1);
        });

        int start = Math.min(page * size, filtered.size());
        int end = Math.min(start + size, filtered.size());
        return new PageImpl<>(filtered.subList(start, end), PageRequest.of(page, size), filtered.size());
    }

    @Override
    @Transactional
    public AdminUserDto updateUserRole(Long userId, Role newRole, String currentUserEmail) {
        User user = userQueryService.getUserOrThrow(userId);

        if (user.getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "admin.error.cannot_change_own_role");
        }

        user.changeRole(newRole);
        user = userQueryService.save(user);
        userAuditService.logRoleChanged(user, newRole.name());
        return mapToUserDto(user);
    }

    @Override
    @Transactional
    public AdminUserDto toggleUserStatus(Long userId) {
        return toggleUserStatus(userId, (AdminBlockRequest) null);
    }

    @Override
    @Transactional
    public AdminUserDto toggleUserStatus(Long userId, AdminBlockRequest request) {
        User user = userQueryService.getUserOrThrow(userId);

        if (user.isActive()) {
            String reason = request != null ? request.getReason() : null;
            String details = request != null ? request.getDetails() : null;
            String fullReason = (reason != null && !reason.isBlank()) ? reason.trim() : messageUtils.getMessage("admin.reason_rules");
            if (details != null && !details.isBlank()) {
                fullReason += ": " + details.trim();
            }
            user.block(fullReason);
            userAuditService.logUserBlocked(user, fullReason);
        } else {
            user.unblock();
            userAuditService.logUserUnblocked(user);
        }

        user = userQueryService.save(user);
        return mapToUserDto(user);
    }

    private AdminUserDto mapToUserDto(User u) {
        List<Bot> uBots = botRepository.findByUserId(u.getId());
        long aCount = flowSchemaRepository.countByUserId(u.getId());
        long brCount = broadcastCampaignRepository.countByUserId(u.getId());
        long cCount = uBots.stream().mapToLong(b -> botUserRepository.countByBotId(b.getId())).sum();

        String pName = subscriptionRepository.findByUserId(u.getId())
                .map(sub -> sub.getPlan() != null ? sub.getPlan().getName() : "FREE")
                .orElse("FREE");

        return adminMapper.toUserDto(u, uBots.size(), aCount, brCount, cCount, 0, pName);
    }
}

