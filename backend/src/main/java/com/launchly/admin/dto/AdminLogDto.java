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
public class AdminLogDto {
    private String id;
    private String level;
    private String service;
    private String message;
    private String userEmail;
    private LocalDateTime timestamp;
}
