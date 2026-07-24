package com.launchly.admin.service;

import com.launchly.admin.dto.AdminUserDto;
import com.launchly.auth.entity.Role;
import org.springframework.data.domain.Page;

public interface AdminUserService {
    Page<AdminUserDto> getUsers(String search, Role roleFilter, String sort, int page, int size);

    default Page<AdminUserDto> getUsers(String search, Role roleFilter, int page, int size) {
        return getUsers(search, roleFilter, "desc", page, size);
    }
    AdminUserDto updateUserRole(Long userId, Role role, String currentUserEmail);
    AdminUserDto toggleUserStatus(Long userId);
    AdminUserDto toggleUserStatus(Long userId, String reason, String details);
    com.launchly.admin.dto.AdminUserDetailDto getUserDetails(Long userId, String period, String category, int page, int size);
}
