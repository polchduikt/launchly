package com.launchly.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAutomationDto {
    private Long id;
    private String name;
    private String triggerType;
    private String ownerEmail;
    private String ownerName;
    private String botName;
    private boolean active;
    private boolean blocked;
    private String blockReason;
    private LocalDateTime blockedAt;
    private long triggerCount;
    private long errorCount;
    private LocalDateTime lastExecutedAt;
}
