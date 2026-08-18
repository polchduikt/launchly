package com.launchly.admin.util;

import com.launchly.admin.entity.UserAuditLog;
import com.launchly.auth.entity.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public final class AdminLogSpecUtils {

    private AdminLogSpecUtils() {
    }

    public static Specification<UserAuditLog> buildSpec(String level, String serviceFilter, String search, LocalDateTime startDt, LocalDateTime endDt) {
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
}
