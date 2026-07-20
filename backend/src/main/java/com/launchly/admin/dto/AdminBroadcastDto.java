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
public class AdminBroadcastDto {
    private Long id;
    private String title;
    private String content;
    private String targetAudience;
    private int sentCount;
    private String status;
    private String createdByEmail;
    private LocalDateTime createdAt;
}
