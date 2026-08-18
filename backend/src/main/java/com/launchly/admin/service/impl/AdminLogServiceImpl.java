package com.launchly.admin.service.impl;

import com.launchly.admin.dto.AdminLogDto;
import com.launchly.admin.entity.UserAuditLog;
import com.launchly.admin.mapper.AdminLogMapper;
import com.launchly.admin.repository.UserAuditLogRepository;
import com.launchly.admin.service.AdminLogService;
import com.launchly.auth.entity.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

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

        Specification<UserAuditLog> spec = buildSpec(level, serviceFilter, search, parseStart(startDate), parseEnd(endDate));
        Page<UserAuditLog> logPage = userAuditLogRepository.findAll(spec, pageable);

        return logPage.map(adminLogMapper::toDto);
    }

    private Specification<UserAuditLog> buildSpec(String level, String serviceFilter, String search, LocalDateTime startDt, LocalDateTime endDt) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (level != null && !level.isBlank() && !"all".equalsIgnoreCase(level)) {
                predicates.add(cb.equal(cb.upper(root.get("badge")), level.toUpperCase()));
            }
            if (serviceFilter != null && !serviceFilter.isBlank() && !"all".equalsIgnoreCase(serviceFilter)) {
                predicates.add(cb.equal(cb.upper(root.get("category")), serviceFilter.toUpperCase()));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";
                Join<UserAuditLog, User> userJoin = root.join("user", JoinType.LEFT);
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern),
                        cb.like(cb.lower(userJoin.get("email")), pattern)
                ));
            }
            if (startDt != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDt));
            }
            if (endDt != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDt));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private LocalDateTime parseStart(String startDate) {
        if (startDate == null || startDate.isBlank()) return null;
        try {
            return LocalDateTime.parse(startDate);
        } catch (Exception e) {
            try {
                return LocalDate.parse(startDate).atStartOfDay();
            } catch (Exception ignored) {
                return null;
            }
        }
    }

    private LocalDateTime parseEnd(String endDate) {
        if (endDate == null || endDate.isBlank()) return null;
        try {
            return LocalDateTime.parse(endDate);
        } catch (Exception e) {
            try {
                return LocalDate.parse(endDate).atTime(LocalTime.MAX);
            } catch (Exception ignored) {
                return null;
            }
        }
    }
}
