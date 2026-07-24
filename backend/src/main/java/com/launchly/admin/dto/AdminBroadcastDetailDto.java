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
public class AdminBroadcastDetailDto {
    private Long id;
    private String title;
    private String content;
    private String targetAudience;
    private String botName;
    private int sentCount;
    private int failedCount;
    private int totalCount;
    private String status;
    private boolean blocked;
    private String blockReason;
    private LocalDateTime blockedAt;
    private String createdByEmail;
    private String authorName;
    private Long authorId;
    private LocalDateTime createdAt;
    private LocalDateTime scheduledAt;
    private Page<UserActivityDto> activities;
}
