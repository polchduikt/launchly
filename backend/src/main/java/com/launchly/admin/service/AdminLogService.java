package com.launchly.admin.service;

import com.launchly.admin.dto.AdminLogDto;
import org.springframework.data.domain.Page;
import java.util.List;

public interface AdminLogService {
    Page<AdminLogDto> getSystemLogs(String level, String serviceFilter, String search, String sort, int page, int size);

    default Page<AdminLogDto> getSystemLogs(String level, String serviceFilter, String search, int page, int size) {
        return getSystemLogs(level, serviceFilter, search, "desc", page, size);
    }

    default List<AdminLogDto> getSystemLogs(String level, String serviceFilter, String search) {
        return getSystemLogs(level, serviceFilter, search, "desc", 0, 100).getContent();
    }
}
