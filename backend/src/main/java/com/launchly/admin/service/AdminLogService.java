package com.launchly.admin.service;

import com.launchly.admin.dto.AdminLogDto;
import java.util.List;

public interface AdminLogService {
    List<AdminLogDto> getSystemLogs(String level, String serviceFilter, String search);
}
