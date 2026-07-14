package com.launchly.notification.scheduler;

import com.launchly.auth.entity.User;
import com.launchly.auth.repository.UserRepository;
import com.launchly.analytics.dto.response.DashboardStatsResponse;
import com.launchly.analytics.service.AnalyticsService;
import com.launchly.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class StatsNotificationScheduler {

    private final UserRepository userRepository;
    private final AnalyticsService analyticsService;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 * * * *")
    public void runScheduledStatsNotifications() {
        LocalDateTime now = LocalDateTime.now();
        String dayOfWeek = now.getDayOfWeek().name();
        int hour = now.getHour();

        log.info("Running scheduled stats notifications check for day: {}, hour: {}", dayOfWeek, hour);

        List<User> users = userRepository.findUsersForStatsNotification(dayOfWeek, hour);
        log.info("Found {} users scheduled for stats notifications at this time", users.size());

        for (User user : users) {
            try {
                DashboardStatsResponse stats = analyticsService.getDashboardStats(0L, user.getStatsDaysRange(), user.getId());
                notificationService.sendStatsReportNotification(user, stats);
            } catch (Exception e) {
                log.error("Failed to generate or send stats report for user {}: {}", user.getEmail(), e.getMessage());
            }
        }
    }
}
