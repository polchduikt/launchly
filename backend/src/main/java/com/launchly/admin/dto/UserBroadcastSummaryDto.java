package com.launchly.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserBroadcastSummaryDto {
    private Long id;
    private String name;
    private String botName;
    private String status;
    private int sentCount;
    private String createdAt;
}
