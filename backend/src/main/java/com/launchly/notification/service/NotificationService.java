package com.launchly.notification.service;

import com.launchly.auth.entity.User;
import com.launchly.auth.dto.response.UserResponse;
import com.launchly.bot.entity.BotUser;
import com.launchly.crm.entity.Conversation;
import com.launchly.notification.dto.UpdateNotificationSettingsRequest;
import com.launchly.analytics.dto.response.DashboardStatsResponse;

public interface NotificationService {

    void sendAssignmentNotification(Long userId, Long botUserId);

    void sendNewMessageNotification(Long userId, Long conversationId, String messageContent);

    void sendStatsReportNotification(User user, DashboardStatsResponse stats);

    UserResponse updateSettings(String email, UpdateNotificationSettingsRequest request);

    UserResponse unlinkTelegram(String email);
}
