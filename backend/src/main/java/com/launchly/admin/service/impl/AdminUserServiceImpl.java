package com.launchly.admin.service.impl;

import com.launchly.admin.dto.AdminUserDetailDto;
import com.launchly.admin.dto.AdminUserDto;
import com.launchly.admin.dto.UserActivityDto;
import com.launchly.admin.entity.UserAuditLog;
import com.launchly.admin.enums.AuditActionType;
import com.launchly.admin.repository.UserAuditLogRepository;
import com.launchly.admin.service.AdminUserService;
import com.launchly.admin.service.UserAuditService;
import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import com.launchly.auth.repository.UserRepository;
import com.launchly.billing.repository.SubscriptionRepository;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.FlowSchema;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.repository.FlowSchemaRepository;
import com.launchly.broadcast.entity.BroadcastCampaign;
import com.launchly.broadcast.repository.BroadcastCampaignRepository;
import com.launchly.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
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

    @Override
    @Transactional
    public AdminUserDetailDto getUserDetails(Long userId, String period, String category, int page, int size) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        LocalDateTime cutoff = LocalDateTime.of(1970, 1, 1, 0, 0);
        if ("week".equalsIgnoreCase(period)) {
            cutoff = LocalDateTime.now().minusDays(7);
        } else if ("month".equalsIgnoreCase(period)) {
            cutoff = LocalDateTime.now().minusDays(30);
        } else if ("3months".equalsIgnoreCase(period)) {
            cutoff = LocalDateTime.now().minusDays(90);
        }
        final LocalDateTime cutoffDate = cutoff;
        final boolean isAllPeriod = "all".equalsIgnoreCase(period) || period == null;

        List<Bot> userBots = botRepository.findByUserId(userId);
        List<Bot> filteredBots = userBots.stream()
                .filter(b -> isAllPeriod || (b.getCreatedAt() != null && !b.getCreatedAt().isBefore(cutoffDate)) || (b.getUpdatedAt() != null && !b.getUpdatedAt().isBefore(cutoffDate)))
                .collect(Collectors.toList());

        long botsCount = isAllPeriod ? userBots.size() : filteredBots.size();
        long automationsCount = flowSchemaRepository.countByUserId(userId);

        long broadcastsCount = userBots.stream()
                .mapToLong(bot -> broadcastCampaignRepository.findByBotIdOrderByCreatedAtDesc(bot.getId()).stream()
                        .filter(c -> isAllPeriod || (c.getCreatedAt() != null && !c.getCreatedAt().isBefore(cutoffDate)))
                        .count())
                .sum();

        long contactsCount = userBots.stream()
                .mapToLong(bot -> botUserRepository.countByBotId(bot.getId()))
                .sum();

        long messagesCount = contactsCount * 3L + automationsCount * 2L;

        String planName = subscriptionRepository.findByUserId(userId)
                .map(sub -> sub.getPlan() != null ? sub.getPlan().getName() : "Pro Plan")
                .orElse("FREE");
        String planStatus = "ACTIVE";

        LocalDateTime lastActivity = userBots.stream()
                .map(b -> b.getUpdatedAt() != null ? b.getUpdatedAt() : b.getCreatedAt())
                .max(LocalDateTime::compareTo)
                .orElse(user.getUpdatedAt() != null ? user.getUpdatedAt() : user.getCreatedAt());

        Page<UserAuditLog> logPage = userAuditLogRepository.findUserLogs(
                userId,
                category != null ? category : "all",
                cutoffDate,
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
                .messagesCount(messagesCount)
                .planName(planName)
                .planStatus(planStatus)
                .lastActivity(lastActivity)
                .activities(activityPage)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserDto> getUsers(String search, Role roleFilter, int page, int size) {
        List<User> allUsers = userRepository.findAll();

        List<AdminUserDto> filtered = allUsers.stream()
                .filter(u -> {
                    if (roleFilter != null && u.getRole() != roleFilter) {
                        return false;
                    }
                    if (search != null && !search.isBlank()) {
                        String q = search.toLowerCase().trim();
                        boolean matchName = u.getName() != null && u.getName().toLowerCase().contains(q);
                        boolean matchEmail = u.getEmail() != null && u.getEmail().toLowerCase().contains(q);
                        boolean matchTg = u.getTelegramUsername() != null && u.getTelegramUsername().toLowerCase().contains(q);
                        return matchName || matchEmail || matchTg;
                    }
                    return true;
                })
                .map(u -> {
                    List<Bot> uBots = botRepository.findByUserId(u.getId());
                    int bCount = uBots.size();
                    long aCount = flowSchemaRepository.countByUserId(u.getId());
                    long brCount = uBots.stream()
                            .mapToLong(b -> broadcastCampaignRepository.findByBotIdOrderByCreatedAtDesc(b.getId()).size())
                            .sum();
                    long cCount = uBots.stream()
                            .mapToLong(b -> botUserRepository.countByBotId(b.getId()))
                            .sum();
                    long mCount = cCount * 3L + aCount * 2L;
                    String pName = subscriptionRepository.findByUserId(u.getId())
                            .map(sub -> sub.getPlan() != null ? sub.getPlan().getName() : "Pro Plan")
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
                            .botsCount(bCount)
                            .automationsCount(aCount)
                            .broadcastsCount(brCount)
                            .contactsCount(cCount)
                            .messagesCount(mCount)
                            .planName(pName)
                            .telegramUsername(u.getTelegramUsername())
                            .build();
                })
                .collect(Collectors.toList());

        int start = Math.min(page * size, filtered.size());
        int end = Math.min(start + size, filtered.size());
        List<AdminUserDto> pageContent = filtered.subList(start, end);

        return new PageImpl<>(pageContent, PageRequest.of(page, size), filtered.size());
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

        return AdminUserDto.builder()
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
                .botsCount((int) botRepository.countByUserId(user.getId()))
                .telegramUsername(user.getTelegramUsername())
                .build();
    }

    @Override
    @Transactional
    public AdminUserDto toggleUserStatus(Long userId) {
        return toggleUserStatus(userId, null, null);
    }

    @Override
    @Transactional
    public AdminUserDto toggleUserStatus(Long userId, String reason, String details) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        boolean willBeActive = !user.isActive();
        user.setActive(willBeActive);

        if (!willBeActive) {
            String defaultReasonKey = "admin.reason_rules";
            String fullReason = (reason != null && !reason.isBlank()) ? reason.trim() : defaultReasonKey;
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

        return AdminUserDto.builder()
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
                .botsCount((int) botRepository.countByUserId(user.getId()))
                .telegramUsername(user.getTelegramUsername())
                .build();
    }
}
