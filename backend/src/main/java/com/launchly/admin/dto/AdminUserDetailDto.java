package com.launchly.admin.dto;

import com.launchly.auth.entity.Provider;
import com.launchly.auth.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDetailDto {
    private Long id;
    private String email;
    private String name;
    private String avatar;
    private Role role;
    private boolean active;
    private String blockReason;
    private LocalDateTime blockedAt;
    private Provider provider;
    private LocalDateTime createdAt;
    private String telegramUsername;
    private long botsCount;
    private long automationsCount;
    private long broadcastsCount;
    private long contactsCount;
    private long messagesCount;
    private String planName;
    private String planStatus;
    private LocalDateTime lastActivity;
    private Page<UserActivityDto> activities;
}
