package com.launchly.admin.util;

import com.launchly.admin.entity.SupportTicket;
import com.launchly.auth.entity.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public final class AdminSupportSpecUtils {

    private AdminSupportSpecUtils() {
    }

    public static Specification<SupportTicket> buildTicketSpec(String filter, String period, String search) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter != null && filter.equalsIgnoreCase("completed")) {
                predicates.add(cb.equal(root.get("status"), "CLOSED"));
            } else if (filter != null && filter.equalsIgnoreCase("resolved")) {
                predicates.add(cb.equal(root.get("status"), "RESOLVED"));
            } else {
                predicates.add(cb.and(
                        cb.notEqual(root.get("status"), "RESOLVED"),
                        cb.notEqual(root.get("status"), "CLOSED")
                ));
                if (filter != null && !filter.isEmpty() && !"all".equalsIgnoreCase(filter)) {
                    if ("unread".equalsIgnoreCase(filter)) {
                        predicates.add(cb.equal(root.get("unreadForAdmin"), true));
                    } else if ("favorites".equalsIgnoreCase(filter)) {
                        predicates.add(cb.equal(root.get("isFavorite"), true));
                    } else if ("active".equalsIgnoreCase(filter)) {
                        predicates.add(cb.equal(root.get("status"), "ACTIVE"));
                    }
                }
            }

            if (period != null && !period.isEmpty() && !"all".equalsIgnoreCase(period)) {
                LocalDate today = LocalDate.now();
                if ("today".equalsIgnoreCase(period)) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("updatedAt"), today.atStartOfDay()));
                } else if ("yesterday".equalsIgnoreCase(period)) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("updatedAt"), today.minusDays(1).atStartOfDay()));
                    predicates.add(cb.lessThan(root.get("updatedAt"), today.atStartOfDay()));
                } else if ("week".equalsIgnoreCase(period)) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("updatedAt"), today.minusDays(7).atStartOfDay()));
                } else if ("month".equalsIgnoreCase(period)) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("updatedAt"), today.minusDays(30).atStartOfDay()));
                }
            }

            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.toLowerCase().trim() + "%";
                Join<SupportTicket, User> userJoin = root.join("user");
                predicates.add(cb.or(
                        cb.like(cb.lower(userJoin.get("name")), searchPattern),
                        cb.like(cb.lower(userJoin.get("email")), searchPattern),
                        cb.like(cb.lower(root.get("lastMessage")), searchPattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
