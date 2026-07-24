package com.launchly.admin.dto;

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
public class AdminAutomationDetailDto {
    private Long id;
    private String name;
    private String triggerType;
    private Long botId;
    private String botName;
    private boolean botActive;
    private boolean blocked;
    private String blockReason;
    private LocalDateTime blockedAt;
    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private String ownerAvatar;
    private int nodesCount;
    private int edgesCount;
    private int integrationsCount;
    private int version;
    private int triggerCount;
    private int errorCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Page<UserActivityDto> activities;
}
