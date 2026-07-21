package com.launchly.admin.service;

import com.launchly.admin.dto.AdminStatsDto;
import java.time.LocalDateTime;

public interface AdminStatsService {
    AdminStatsDto getStats(String search, String period, LocalDateTime startDate, LocalDateTime endDate);
}
