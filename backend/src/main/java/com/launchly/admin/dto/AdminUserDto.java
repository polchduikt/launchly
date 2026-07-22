package com.launchly.admin.dto;

import com.launchly.auth.entity.Provider;
import com.launchly.auth.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDto {
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
    private int botsCount;
    private String telegramUsername;
}
