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
    public AdminUserDto updateUserRole(Long userId, Role role, String currentUserEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "You cannot change your own administrative role");
        }

        user.setRole(role);
        user = userRepository.save(user);

        return AdminUserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .avatar(user.getAvatar())
                .role(user.getRole())
                .active(user.isActive())
                .provider(user.getProvider())
                .createdAt(user.getCreatedAt())
                .botsCount((int) botRepository.countByUserId(user.getId()))
                .telegramUsername(user.getTelegramUsername())
                .build();
    }

    @Override
    @Transactional
    public AdminUserDto toggleUserStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        user.setActive(!user.isActive());
        user = userRepository.save(user);

        return AdminUserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .avatar(user.getAvatar())
                .role(user.getRole())
                .active(user.isActive())
                .provider(user.getProvider())
                .createdAt(user.getCreatedAt())
                .botsCount((int) botRepository.countByUserId(user.getId()))
                .telegramUsername(user.getTelegramUsername())
                .build();
    }
}
