package com.launchly.admin.service.impl;

import com.launchly.admin.dto.AdminUserDetailDto;
import com.launchly.admin.dto.AdminUserDto;
import com.launchly.admin.dto.UserActivityDto;
import com.launchly.admin.dto.UserAutomationSummaryDto;
import com.launchly.admin.dto.UserBroadcastSummaryDto;
import com.launchly.admin.entity.UserAuditLog;
import com.launchly.admin.repository.UserAuditLogRepository;
import com.launchly.admin.service.AdminUserService;
import com.launchly.admin.service.UserAuditService;
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
import com.launchly.common.utils.EncryptionUtil;
import com.launchly.crm.repository.ConversationRepository;
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
    private final ConversationRepository conversationRepository;
    private final EncryptionUtil encryptionUtil;

    private boolean isBotConnected(Bot bot) {
        if (bot == null) return false;
        String rawToken = bot.getTelegramToken();
        if (rawToken == null || rawToken.isBlank()) return false;
        try {
            String decrypted = encryptionUtil.decrypt(rawToken);
            return decrypted != null && !decrypted.isBlank() && !"0000000000:dummyTokenPlaceholderForNoBotConfig".equals(decrypted);
        } catch (Exception e) {
            return false;
        }
    }

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

        LocalDateTime cutoffDate = cutoff;

        List<Bot> userBots = botRepository.findByUserId(userId);
        long botsCount = userBots.size();

        long automationsCount = flowSchemaRepository.countByUserId(userId);

        long broadcastsCount = userBots.stream()
                .mapToLong(b -> broadcastCampaignRepository.findByBotIdOrderByCreatedAtDesc(b.getId()).size())
                .sum();

        long contactsCount = userBots.stream()
                .mapToLong(b -> botUserRepository.countByBotId(b.getId()))
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

        List<UserAutomationSummaryDto> userAutomations = flowSchemaRepository.findAllByUserId(userId).stream()
                .map(f -> {
                    Bot bot = f.getBot();
                    boolean connected = isBotConnected(bot);
                    long execCount = (bot != null && connected) ? conversationRepository.countByBotId(bot.getId()) : 0;
                    int runs = connected ? Math.max((int) execCount, f.getVersion()) : 0;
                    String bName = (connected && bot.getName() != null && !bot.getName().isBlank()) ? bot.getName() : "—";
                    return UserAutomationSummaryDto.builder()
                            .id(f.getId())
                            .name(bot != null ? bot.getName() : "Flow #" + f.getId())
                            .botName(bName)
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
                        .botName(bc.getBot() != null ? bc.getBot().getName() : "—")
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
                .messagesCount(messagesCount)
                .planName(planName)
                .planStatus(planStatus)
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
                .filter(u -> {
                    if (roleFilter != null && u.getRole() != roleFilter) {
                        return false;
                    }
                    if (search != null && !search.isBlank()) {
                        String q = search.toLowerCase().trim();
                        boolean matchName = u.getName() != null && u.getName().toLowerCase().contains(q);
                        boolean matchEmail = u.getEmail() != null && u.getEmail().toLowerCase().contains(q);
                        boolean matchTg = u.getTelegramUsername() != null && u.getTelegramUsername().toLowerCase().contains(q);
                        if (!matchName && !matchEmail && !matchTg) {
                            return false;
                        }
                    }
                    if (planFilter != null && !planFilter.isBlank()) {
                        String pName = subscriptionRepository.findByUserId(u.getId())
                                .map(sub -> sub.getPlan() != null ? sub.getPlan().getName() : "PRO")
                                .orElse("FREE");
                        if (!pName.equalsIgnoreCase(planFilter.trim())) {
                            return false;
                        }
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

        if ("asc".equalsIgnoreCase(sort)) {
            filtered.sort((a, b) -> {
                LocalDateTime t1 = a.getCreatedAt() != null ? a.getCreatedAt() : LocalDateTime.MIN;
                LocalDateTime t2 = b.getCreatedAt() != null ? b.getCreatedAt() : LocalDateTime.MIN;
                return t1.compareTo(t2);
            });
        } else {
            filtered.sort((a, b) -> {
                LocalDateTime t1 = a.getCreatedAt() != null ? a.getCreatedAt() : LocalDateTime.MIN;
                LocalDateTime t2 = b.getCreatedAt() != null ? b.getCreatedAt() : LocalDateTime.MIN;
                return t2.compareTo(t1);
            });
        }

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
