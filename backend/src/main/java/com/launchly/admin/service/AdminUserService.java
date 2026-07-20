package com.launchly.admin.service;

import com.launchly.admin.dto.AdminUserDto;
import com.launchly.auth.entity.Role;
import org.springframework.data.domain.Page;

public interface AdminUserService {
    Page<AdminUserDto> getUsers(String search, Role roleFilter, int page, int size);
    AdminUserDto updateUserRole(Long userId, Role role, String currentUserEmail);
    AdminUserDto toggleUserStatus(Long userId);
}
