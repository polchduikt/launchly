package com.launchly.admin.service.impl;

import com.launchly.admin.dto.AdminLogDto;
import com.launchly.admin.entity.UserAuditLog;
import com.launchly.admin.mapper.AdminLogMapper;
import com.launchly.admin.repository.UserAuditLogRepository;
import com.launchly.admin.service.AdminLogService;
import com.launchly.admin.util.AdminLogSpecUtils;
import com.launchly.common.utils.DateTimeUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminLogServiceImpl implements AdminLogService {

    private final UserAuditLogRepository userAuditLogRepository;
    private final AdminLogMapper adminLogMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<AdminLogDto> getSystemLogs(String level, String serviceFilter, String search, String startDate, String endDate, String sort, int page, int size) {
        Sort.Direction direction = "asc".equalsIgnoreCase(sort) ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageable = PageRequest.of(page, size <= 0 ? 100 : size, Sort.by(direction, "createdAt"));

        Specification<UserAuditLog> spec = AdminLogSpecUtils.buildSpec(
                level,
                serviceFilter,
                search,
                DateTimeUtils.parseStart(startDate),
                DateTimeUtils.parseEnd(endDate)
        );
        Page<UserAuditLog> logPage = userAuditLogRepository.findAll(spec, pageable);

        return logPage.map(adminLogMapper::toDto);
    }
}
