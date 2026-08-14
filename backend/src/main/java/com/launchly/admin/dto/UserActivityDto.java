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
public class UserActivityDto {
    private Long id;
    private Long targetId;
    private String targetName;
    private String title;
    private String description;
    private String category;
    private String badge;
    private LocalDateTime timestamp;
}
