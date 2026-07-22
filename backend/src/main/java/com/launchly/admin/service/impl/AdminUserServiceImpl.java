package com.launchly.admin.service.impl;

import com.launchly.admin.dto.AdminUserDto;
import com.launchly.admin.service.AdminUserService;
import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import com.launchly.auth.repository.UserRepository;
import com.launchly.bot.repository.BotRepository;
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
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final BotRepository botRepository;

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
                .map(u -> AdminUserDto.builder()
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
                        .botsCount((int) botRepository.countByUserId(u.getId()))
                        .telegramUsername(u.getTelegramUsername())
                        .build())
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
            String fullReason = (reason != null && !reason.isBlank()) ? reason.trim() : "Порушення правил платформи";
            if (details != null && !details.isBlank()) {
                fullReason += ": " + details.trim();
            }
            user.setBlockReason(fullReason);
            user.setBlockedAt(LocalDateTime.now());
        } else {
            user.setBlockReason(null);
            user.setBlockedAt(null);
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
