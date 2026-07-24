package com.launchly.admin.service.impl;

import com.launchly.admin.dto.AdminLogDto;
import com.launchly.admin.entity.UserAuditLog;
import com.launchly.admin.repository.UserAuditLogRepository;
import com.launchly.admin.service.AdminLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminLogServiceImpl implements AdminLogService {

    private final UserAuditLogRepository userAuditLogRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<AdminLogDto> getSystemLogs(String level, String serviceFilter, String search, String startDate, String endDate, String sort, int page, int size) {
        List<AdminLogDto> logs = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        LocalDateTime parsedStart = null;
        LocalDateTime parsedEnd = null;

        if (startDate != null && !startDate.isBlank()) {
            try {
                parsedStart = LocalDateTime.parse(startDate);
            } catch (Exception e) {
                try {
                    parsedStart = java.time.LocalDate.parse(startDate).atStartOfDay();
                } catch (Exception ignored) {}
            }
        }

        if (endDate != null && !endDate.isBlank()) {
            try {
                parsedEnd = LocalDateTime.parse(endDate);
            } catch (Exception e) {
                try {
                    parsedEnd = java.time.LocalDate.parse(endDate).atTime(java.time.LocalTime.MAX);
                } catch (Exception ignored) {}
            }
        }

        LocalDateTime finalStart = parsedStart;
        LocalDateTime finalEnd = parsedEnd;

        Sort.Direction direction = "asc".equalsIgnoreCase(sort) ? Sort.Direction.ASC : Sort.Direction.DESC;
        List<UserAuditLog> dbLogs = userAuditLogRepository.findAll(Sort.by(direction, "createdAt"));
        long counter = 1;
        for (UserAuditLog dbLog : dbLogs) {
            String uEmail = dbLog.getUser() != null ? dbLog.getUser().getEmail() : "system";
            String logLevel = dbLog.getBadge() != null ? dbLog.getBadge().toUpperCase() : "INFO";
            String logService = dbLog.getCategory() != null ? dbLog.getCategory().toUpperCase() : "SYSTEM";
            String msg = dbLog.getTitle() + (dbLog.getDescription() != null && !dbLog.getDescription().isBlank() ? " - " + dbLog.getDescription() : "");
            
            logs.add(new AdminLogDto(String.valueOf(counter++), logLevel, logService, msg, uEmail, dbLog.getCreatedAt() != null ? dbLog.getCreatedAt() : now));
        }

        List<AdminLogDto> filtered = logs.stream()
                .filter(l -> {
                    if (level != null && !level.isBlank() && !level.equalsIgnoreCase("all") && !l.getLevel().equalsIgnoreCase(level)) {
                        return false;
                    }
                    if (serviceFilter != null && !serviceFilter.isBlank() && !serviceFilter.equalsIgnoreCase("all") && !l.getService().equalsIgnoreCase(serviceFilter)) {
                        return false;
                    }
                    if (search != null && !search.isBlank()) {
                        String q = search.toLowerCase();
                        if (!l.getMessage().toLowerCase().contains(q) && !l.getUserEmail().toLowerCase().contains(q)) {
                            return false;
                        }
                    }
                    if (finalStart != null && l.getTimestamp() != null && l.getTimestamp().isBefore(finalStart)) {
                        return false;
                    }
                    if (finalEnd != null && l.getTimestamp() != null && l.getTimestamp().isAfter(finalEnd)) {
                        return false;
                    }
                    return true;
                })
                .collect(Collectors.toList());

        int safeSize = size <= 0 ? 100 : size;
        int safePage = Math.max(page, 0);
        int fromIndex = Math.min(safePage * safeSize, filtered.size());
        int toIndex = Math.min(fromIndex + safeSize, filtered.size());

        List<AdminLogDto> pagedContent = filtered.subList(fromIndex, toIndex);
        return new PageImpl<>(pagedContent, PageRequest.of(safePage, safeSize), filtered.size());
    }
}
