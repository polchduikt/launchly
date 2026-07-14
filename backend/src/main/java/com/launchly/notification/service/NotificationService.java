package com.launchly.notification.service;

import com.launchly.auth.entity.User;
import com.launchly.auth.dto.response.UserResponse;
import com.launchly.bot.entity.BotUser;
import com.launchly.crm.entity.Conversation;
import com.launchly.notification.dto.UpdateNotificationSettingsRequest;
import com.launchly.analytics.dto.response.DashboardStatsResponse;

public interface NotificationService {

    void sendAssignmentNotification(User user, BotUser botUser);

    void sendNewMessageNotification(User user, Conversation conversation, String messageContent);

    void sendStatsReportNotification(User user, DashboardStatsResponse stats);

    UserResponse updateSettings(String email, UpdateNotificationSettingsRequest request);

    UserResponse unlinkTelegram(String email);
}
