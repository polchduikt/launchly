package com.launchly.admin.util;

import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class AdminPeriodResolver {

    public LocalDateTime resolve(String period) {
        return resolve(period, null);
    }

    public LocalDateTime resolve(String period, LocalDateTime customStart) {
        if (period == null) period = "week";
        return switch (period.toLowerCase()) {
            case "day" -> LocalDateTime.now().minusDays(1);
            case "today" -> LocalDate.now().atStartOfDay();
            case "yesterday" -> LocalDate.now().minusDays(1).atStartOfDay();
            case "week", "7d", "7_days" -> LocalDateTime.now().minusDays(7);
            case "2weeks" -> LocalDateTime.now().minusDays(14);
            case "month", "30d", "30_days" -> LocalDateTime.now().minusDays(30);
            case "2months" -> LocalDateTime.now().minusDays(60);
            case "3months", "90d", "90_days" -> LocalDateTime.now().minusDays(90);
            case "custom" -> customStart != null ? customStart : LocalDateTime.now().minusDays(7);
            default -> LocalDateTime.of(2020, 1, 1, 0, 0);
        };
    }
}
