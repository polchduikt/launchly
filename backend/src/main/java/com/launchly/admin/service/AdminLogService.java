package com.launchly.admin.service;

import com.launchly.admin.dto.AdminLogDto;
import org.springframework.data.domain.Page;

public interface AdminLogService {
    Page<AdminLogDto> getSystemLogs(String level, String serviceFilter, String search, String startDate, String endDate,
                                    String sort, int page, int size);
}
