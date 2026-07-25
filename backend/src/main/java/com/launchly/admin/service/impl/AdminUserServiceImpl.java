package com.launchly.admin.service.impl;

import com.launchly.admin.dto.AdminUserDetailDto;
import com.launchly.admin.dto.AdminUserDto;
import com.launchly.admin.dto.AdminBlockRequest;
import com.launchly.admin.dto.UserActivityDto;
import com.launchly.admin.dto.UserAutomationSummaryDto;
import com.launchly.admin.dto.UserBroadcastSummaryDto;
import com.launchly.admin.entity.UserAuditLog;
import com.launchly.admin.repository.UserAuditLogRepository;
import com.launchly.admin.service.AdminUserService;
import com.launchly.admin.service.UserAuditService;
import com.launchly.admin.util.AdminPeriodResolver;
import com.launchly.admin.util.BotTokenValidator;
import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import com.launchly.auth.repository.UserRepository;
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

    private final UserRepository userRepository;
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
    private final MessageUtils messageUtils;

    @Override
    @Transactional
    public AdminUserDetailDto getUserDetails(Long userId, String period, String category, int page, int size) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

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

        Page<UserActivityDto> activityPage = logPage.map(l -> UserActivityDto.builder()
                .id(l.getId())
                .title(l.getTitle())
                .description(l.getDescription())
                .category(l.getCategory())
                .badge(l.getBadge())
                .timestamp(l.getCreatedAt())
                .build());

        List<UserAutomationSummaryDto> userAutomations = flowSchemaRepository.findAllByUserId(userId).stream()
                .map(f -> {
                    Bot bot = f.getBot();
                    boolean connected = botTokenValidator.isConnected(bot);
                    long execCount = (bot != null && connected) ? conversationRepository.countByBotId(bot.getId()) : 0;
                    int runs = connected ? Math.max((int) execCount, f.getVersion()) : 0;
                    return UserAutomationSummaryDto.builder()
                            .id(f.getId())
                            .name(bot != null ? bot.getName() : "Flow #" + f.getId())
                            .botName(botTokenValidator.resolveBotName(bot))
                            .active(bot != null && bot.isActive() && connected)
                            .triggerCount(runs)
                            .triggerType("KEYWORD")
                            .build();
                })
                .collect(Collectors.toList());

        List<UserBroadcastSummaryDto> userBroadcasts = userBots.stream()
                .flatMap(b -> broadcastCampaignRepository.findByBotIdOrderByCreatedAtDesc(b.getId()).stream())
                .map(bc -> UserBroadcastSummaryDto.builder()
                        .id(bc.getId())
                        .name(bc.getName())
                        .botName(bc.getBot() != null ? bc.getBot().getName() : "\u2014")
                        .status(bc.getStatus() != null ? bc.getStatus().name() : "DRAFT")
                        .sentCount(bc.getSentCount() != null ? bc.getSentCount() : 0)
                        .createdAt(bc.getCreatedAt() != null ? bc.getCreatedAt().toString() : "")
                        .build())
                .collect(Collectors.toList());

        return AdminUserDetailDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .avatar(user.getAvatar())
                .role(user.getRole())
                .active(user.isActive())
                .blockReason(user.getBlockReason())
                .blockedAt(user.getBlockedAt())
                .provider(user.getProvider())
                .createdAt(user.getCreatedAt())
                .telegramUsername(user.getTelegramUsername())
                .botsCount(botsCount)
                .automationsCount(automationsCount)
                .broadcastsCount(broadcastsCount)
                .contactsCount(contactsCount)
                .messagesCount(0)
                .planName(planName)
                .planStatus("ACTIVE")
                .lastActivity(lastActivity)
                .activities(activityPage)
                .automations(userAutomations)
                .broadcasts(userBroadcasts)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserDto> getUsers(String search, Role roleFilter, String planFilter, String sort, int page, int size) {
        List<User> allUsers = userRepository.findAll();

        List<AdminUserDto> filtered = allUsers.stream()
                .filter(u -> matchesRole(u, roleFilter))
                .filter(u -> matchesSearch(u, search))
                .filter(u -> matchesPlan(u, planFilter))
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
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "You cannot change your own administrative role");
        }

        user.setRole(newRole);
        user = userRepository.save(user);
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
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        boolean willBeActive = !user.isActive();
        user.setActive(willBeActive);

        if (!willBeActive) {
            String reason = request != null ? request.getReason() : null;
            String details = request != null ? request.getDetails() : null;
            String fullReason = (reason != null && !reason.isBlank()) ? reason.trim() : messageUtils.getMessage("admin.reason_rules");
            if (details != null && !details.isBlank()) {
                fullReason += ": " + details.trim();
            }
            user.setBlockReason(fullReason);
            user.setBlockedAt(LocalDateTime.now());
            userAuditService.logUserBlocked(user, fullReason);
        } else {
            user.setBlockReason(null);
            user.setBlockedAt(null);
            userAuditService.logUserUnblocked(user);
        }

        user = userRepository.save(user);
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

        return AdminUserDto.builder()
                .id(u.getId())
                .email(u.getEmail())
                .name(u.getName())
                .avatar(u.getAvatar())
                .role(u.getRole())
                .active(u.isActive())
                .blockReason(u.getBlockReason())
                .blockedAt(u.getBlockedAt())
                .provider(u.getProvider())
                .createdAt(u.getCreatedAt())
                .botsCount(uBots.size())
                .automationsCount(aCount)
                .broadcastsCount(brCount)
                .contactsCount(cCount)
                .messagesCount(0)
                .planName(pName)
                .telegramUsername(u.getTelegramUsername())
                .build();
    }

    private boolean matchesRole(User u, Role roleFilter) {
        return roleFilter == null || u.getRole() == roleFilter;
    }

    private boolean matchesSearch(User u, String search) {
        if (search == null || search.isBlank()) return true;
        String q = search.toLowerCase().trim();
        return (u.getName() != null && u.getName().toLowerCase().contains(q)) ||
               (u.getEmail() != null && u.getEmail().toLowerCase().contains(q)) ||
               (u.getTelegramUsername() != null && u.getTelegramUsername().toLowerCase().contains(q));
    }

    private boolean matchesPlan(User u, String planFilter) {
        if (planFilter == null || planFilter.isBlank()) return true;
        String pName = subscriptionRepository.findByUserId(u.getId())
                .map(sub -> sub.getPlan() != null ? sub.getPlan().getName() : "FREE")
                .orElse("FREE");
        return pName.equalsIgnoreCase(planFilter.trim());
    }
}
