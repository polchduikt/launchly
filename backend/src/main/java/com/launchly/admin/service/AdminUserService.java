package com.launchly.admin.service;

import com.launchly.admin.dto.AdminBlockRequest;
import com.launchly.admin.dto.AdminUserDetailDto;
import com.launchly.admin.dto.AdminUserDto;
import com.launchly.auth.entity.Role;
import org.springframework.data.domain.Page;

public interface AdminUserService {
    Page<AdminUserDto> getUsers(String search, Role roleFilter, String planFilter, String sort, int page, int size);
    AdminUserDto updateUserRole(Long userId, Role role, String currentUserEmail);
    AdminUserDto toggleUserStatus(Long userId);
    AdminUserDto toggleUserStatus(Long userId, AdminBlockRequest request);
    AdminUserDetailDto getUserDetails(Long userId, String period, String category, int page, int size);
}
