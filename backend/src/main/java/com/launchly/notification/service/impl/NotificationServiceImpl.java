package com.launchly.notification.service.impl;

import com.launchly.auth.entity.User;
import com.launchly.auth.service.UserQueryService;
import com.launchly.auth.mapper.AuthMapper;
import com.launchly.auth.dto.response.UserResponse;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.crm.entity.Conversation;
import com.launchly.crm.repository.ConversationRepository;
import com.launchly.notification.dto.UpdateNotificationSettingsRequest;
import com.launchly.analytics.dto.response.DashboardStatsResponse;
import com.launchly.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;
import org.springframework.transaction.annotation.Transactional;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.InlineKeyboardMarkup;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.InlineKeyboardButton;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.InlineKeyboardRow;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import com.launchly.bot.telegram.TelegramBotManager;
import java.util.ArrayList;
import java.util.List;

import com.launchly.bot.constant.TelegramConstants;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private static final int MAX_MESSAGE_PREVIEW_LENGTH = 150;
    private static final int TRUNCATED_PREVIEW_LENGTH = 147;
    private static final int TOP_BUTTONS_LIMIT = 5;

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final ObjectProvider<TelegramBotManager> botManagerProvider;
    private final UserQueryService userQueryService;
    private final BotUserRepository botUserRepository;
    private final ConversationRepository conversationRepository;
    private final AuthMapper authMapper;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    @Transactional
    public UserResponse updateSettings(String email, UpdateNotificationSettingsRequest request) {
        User user = userQueryService.getUserByEmailOrThrow(email);
        
        user.updateNotificationPreferences(request.notifyEmail(), request.notifyTelegram(), request.notificationEmail());
        
        user.setStatsNotificationsEnabled(request.statsNotificationsEnabled());
        user.setStatsDayOfWeek(request.statsDayOfWeek());
        user.setStatsHour(request.statsHour());
        user.setStatsDaysRange(request.statsDaysRange());
        user.setStatsNotifyEmail(request.statsNotifyEmail());
        user.setStatsNotifyTelegram(request.statsNotifyTelegram());
        
        user = userQueryService.save(user);
        return authMapper.toUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse unlinkTelegram(String email) {
        User user = userQueryService.getUserByEmailOrThrow(email);
        user.unlinkTelegram();
        user = userQueryService.save(user);
        return authMapper.toUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateTimezone(String email, String timezone) {
        User user = userQueryService.getUserByEmailOrThrow(email);
        user.setTimezone(timezone);
        user = userQueryService.save(user);
        return authMapper.toUserResponse(user);
    }

    @Override
    @Async
    @Transactional(readOnly = true)
    public void sendAssignmentNotification(Long userId, Long botUserId) {
        User user = userQueryService.findById(userId).orElse(null);
        BotUser botUser = botUserRepository.findById(botUserId).orElse(null);
        if (user == null || botUser == null) {
            log.warn("User {} or BotUser {} not found, skipping assignment notification.", userId, botUserId);
            return;
        }

        String contactName = (botUser.getFirstName() != null ? botUser.getFirstName() : "") + 
                             (botUser.getLastName() != null ? " " + botUser.getLastName() : "");
        if (contactName.trim().isEmpty()) {
            contactName = botUser.getUsername() != null ? "@" + botUser.getUsername() : "Contact ID " + botUser.getId();
        }

        String message = String.format("A new contact (%s) has performed a specific action in your bot '%s' and requires attention.",
                contactName, botUser.getBot().getName());

        log.info("Dispatching notification: '{}'", message);

        if (user.isNotifyEmail()) {
            String toEmail = user.getNotificationEmail() != null ? user.getNotificationEmail() : user.getEmail();
            if (toEmail != null && !toEmail.isBlank()) {
                JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
                if (mailSender != null) {
                    try {
                        MimeMessage mimeMessage = mailSender.createMimeMessage();
                        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
                        helper.setTo(toEmail);
                        helper.setSubject("Launchly Notification: Contact Requires Attention");
                        
                        String htmlMsg = String.format(
                            "<div style=\"font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;\">" +
                            "  <h2 style=\"color: #1e293b; margin-top: 0; font-size: 20px;\">👤 Contact Requires Attention</h2>" +
                            "  <p style=\"color: #475569; font-size: 14px;\">%s</p>" +
                            "</div>",
                            message
                        );
                        helper.setText(htmlMsg, true);
                        mailSender.send(mimeMessage);
                        log.info("Sent email notification to {}", toEmail);
                    } catch (Exception e) {
                        log.error("Failed to send email notification to {}: {}", toEmail, e.getMessage());
                    }
                } else {
                    log.warn("JavaMailSender is not configured. Logged notification: {}", message);
                }
            }
        }

        if (user.isNotifyTelegram() && user.getTelegramUserId() != null) {
            TelegramBotManager botManager = botManagerProvider.getIfAvailable();
            TelegramClient systemBotClient = botManager != null ? botManager.getTelegramClient(-1L) : null;
            if (systemBotClient != null) {
                try {
                    SendMessage sendMessage = SendMessage.builder()
                            .chatId(user.getTelegramUserId().toString())
                            .text(message)
                            .build();
                    systemBotClient.execute(sendMessage);
                    log.info("Sent Telegram notification to user {}", user.getTelegramUserId());
                } catch (Exception e) {
                    log.error("Failed to send Telegram notification to {}: {}", user.getTelegramUserId(), e.getMessage());
                }
            } else {
                log.warn("System bot client not registered, skipping Telegram notification.");
            }
        }
    }

    @Override
    @Async
    @Transactional(readOnly = true)
    public void sendNewMessageNotification(Long userId, Long conversationId, String messageContent) {
        User user = userQueryService.findById(userId).orElse(null);
        Conversation conversation = conversationRepository.findById(conversationId).orElse(null);
        if (user == null || conversation == null) {
            log.warn("User {} or Conversation {} not found, skipping message notification.", userId, conversationId);
            return;
        }

        BotUser botUser = conversation.getBotUser();
        String contactName = (botUser.getFirstName() != null ? botUser.getFirstName() : "") + 
                             (botUser.getLastName() != null ? " " + botUser.getLastName() : "");
        if (contactName.trim().isEmpty()) {
            contactName = botUser.getUsername() != null ? "@" + botUser.getUsername() : "Contact ID " + botUser.getId();
        }

        String contactMention = botUser.getUsername() != null 
                ? String.format("<a href=\"" + TelegramConstants.TELEGRAM_DEEP_LINK + "%s\">%s (@%s)</a>", botUser.getUsername(), contactName, botUser.getUsername())
                : String.format("<a href=\"" + TelegramConstants.TELEGRAM_USER_LINK + "%d\">%s</a>", botUser.getTelegramId(), contactName);

        String messageText = messageContent;
        if (messageText != null && messageText.length() > MAX_MESSAGE_PREVIEW_LENGTH) {
            messageText = messageText.substring(0, TRUNCATED_PREVIEW_LENGTH) + "...";
        }

        String convUrl = String.format("%s/chat?conversationId=%d", frontendUrl, conversation.getId());

        String telegramHtmlMessage = String.format(
                "✉️ <b>New Message Received</b>\n\n" +
                "<b>Bot:</b> %s\n" +
                "<b>Contact:</b> %s\n\n" +
                "<b>Message:</b>\n" +
                "<i>\"%s\"</i>\n\n" +
                "🔗 <a href=\"%s\">Open in Launchly</a>",
                conversation.getBot().getName(), contactMention, messageText, convUrl
        );

        if (user.isNotifyEmail()) {
            String toEmail = user.getNotificationEmail() != null ? user.getNotificationEmail() : user.getEmail();
            if (toEmail != null && !toEmail.isBlank()) {
                JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
                if (mailSender != null) {
                    try {
                        MimeMessage mimeMessage = mailSender.createMimeMessage();
                        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
                        helper.setTo(toEmail);
                        helper.setSubject("Launchly: New Message from " + contactName);
                        
                        String htmlMsg = String.format(
                            "<div style=\"font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;\">" +
                            "  <h2 style=\"color: #1e293b; margin-top: 0; font-size: 20px;\">✉️ New Message Received</h2>" +
                            "  <p style=\"color: #475569; font-size: 14px;\">A contact has sent a message to your bot <strong>%s</strong>.</p>" +
                            "  <div style=\"background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0;\">" +
                            "    <p style=\"margin: 0 0 8px 0; font-size: 14px; color: #334155;\"><strong>Contact:</strong> %s</p>" +
                            "    <p style=\"margin: 0; font-size: 14px; color: #334155;\"><strong>Message:</strong></p>" +
                            "    <blockquote style=\"margin: 8px 0 0 0; padding-left: 12px; border-left: 3px solid #2563eb; font-style: italic; color: #1e293b;\">%s</blockquote>" +
                            "  </div>" +
                            "  <a href=\"%s\" style=\"display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: bold;\">💬 Open in Inbox</a>" +
                            "</div>",
                            conversation.getBot().getName(),
                            contactName,
                            messageText.replace("\n", "<br>"),
                            convUrl
                        );
                        helper.setText(htmlMsg, true);
                        mailSender.send(mimeMessage);
                        log.info("Sent email notification to {}", toEmail);
                    } catch (Exception e) {
                        log.error("Failed to send email notification to {}: {}", toEmail, e.getMessage());
                    }
                }
            }
        }

        if (user.isNotifyTelegram() && user.getTelegramUserId() != null) {
            TelegramBotManager botManager = botManagerProvider.getIfAvailable();
            TelegramClient systemBotClient = botManager != null ? botManager.getTelegramClient(-1L) : null;
            if (systemBotClient != null) {
                try {
                    List<InlineKeyboardRow> keyboard = new ArrayList<>();
                    InlineKeyboardRow row = new InlineKeyboardRow();

                    String profileUrl = botUser.getUsername() != null 
                            ? TelegramConstants.TELEGRAM_DEEP_LINK + botUser.getUsername()
                            : TelegramConstants.TELEGRAM_USER_LINK + botUser.getTelegramId();
                    
                    row.add(InlineKeyboardButton.builder()
                            .text("👤 View Profile")
                            .url(profileUrl)
                            .build());

                    String telegramUrl = convUrl;
                    if (telegramUrl.contains("localhost") || telegramUrl.contains("127.0.0.1")) {
                        telegramUrl = telegramUrl.replace("localhost", "lvh.me")
                                                 .replace("127.0.0.1", "lvh.me");
                    }

                    row.add(InlineKeyboardButton.builder()
                            .text("💬 Open Conversation")
                            .url(telegramUrl)
                            .build());

                    keyboard.add(row);
                    
                    InlineKeyboardMarkup keyboardMarkup = InlineKeyboardMarkup.builder()
                            .keyboard(keyboard)
                            .build();

                    SendMessage sendMessage = SendMessage.builder()
                            .chatId(user.getTelegramUserId().toString())
                            .text(telegramHtmlMessage)
                            .parseMode("HTML")
                            .replyMarkup(keyboardMarkup)
                            .build();

                    systemBotClient.execute(sendMessage);
                    log.info("Sent Telegram notification to user {}", user.getTelegramUserId());
                } catch (Exception e) {
                    log.error("Failed to send Telegram notification to {}: {}", user.getTelegramUserId(), e.getMessage());
                }
            }
        }
    }

    @Override
    @Async
    public void sendStatsReportNotification(User user, DashboardStatsResponse stats) {
        log.info("Sending statistics report to user {}", user.getEmail());

        String statsUrl = String.format("%s/dashboard", frontendUrl);

        StringBuilder topButtonsHtml = new StringBuilder();
        if (stats.topButtons() == null || stats.topButtons().isEmpty()) {
            topButtonsHtml.append("<p style=\"color: #64748b; font-style: italic; font-size: 14px;\">No button clicks logged in this period.</p>");
        } else {
            topButtonsHtml.append("<table style=\"width: 100%; border-collapse: collapse;\">");
            topButtonsHtml.append("  <thead>");
            topButtonsHtml.append("    <tr style=\"background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; text-align: left;\">");
            topButtonsHtml.append("      <th style=\"padding: 10px; font-size: 13px; color: #475569;\">Button Name</th>");
            topButtonsHtml.append("      <th style=\"padding: 10px; font-size: 13px; color: #475569; text-align: right;\">Clicks</th>");
            topButtonsHtml.append("    </tr>");
            topButtonsHtml.append("  </thead>");
            topButtonsHtml.append("  <tbody>");
            for (DashboardStatsResponse.ButtonStatsEntry entry : stats.topButtons().stream().limit(TOP_BUTTONS_LIMIT).toList()) {
                topButtonsHtml.append("    <tr style=\"border-bottom: 1px solid #f1f5f9;\">");
                topButtonsHtml.append(String.format("      <td style=\"padding: 10px; font-size: 13px; color: #1e293b;\">%s</td>", entry.buttonName()));
                topButtonsHtml.append(String.format("      <td style=\"padding: 10px; font-size: 13px; color: #1e293b; text-align: right;\">%d</td>", entry.clicks()));
                topButtonsHtml.append("    </tr>");
            }
            topButtonsHtml.append("  </tbody>");
            topButtonsHtml.append("</table>");
        }

        StringBuilder topButtonsTg = new StringBuilder();
        if (stats.topButtons() == null || stats.topButtons().isEmpty()) {
            topButtonsTg.append("<i>No button clicks logged.</i>");
        } else {
            int count = 1;
            for (DashboardStatsResponse.ButtonStatsEntry entry : stats.topButtons().stream().limit(TOP_BUTTONS_LIMIT).toList()) {
                topButtonsTg.append(String.format("%d. <b>%s</b> — %d clicks\n", count++, entry.buttonName(), entry.clicks()));
            }
        }

        if (user.isStatsNotifyEmail()) {
            String toEmail = user.getNotificationEmail() != null ? user.getNotificationEmail() : user.getEmail();
            if (toEmail != null && !toEmail.isBlank()) {
                JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
                if (mailSender != null) {
                    try {
                        MimeMessage mimeMessage = mailSender.createMimeMessage();
                        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
                        helper.setTo(toEmail);
                        helper.setSubject("Launchly Statistics Report: Past " + user.getStatsDaysRange() + " days");

                        String htmlMsg = String.format(
                            "<div style=\"font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;\">" +
                            "  <h2 style=\"color: #1e293b; margin-top: 0; font-size: 22px; border-bottom: 2px solid #2563eb; padding-bottom: 10px; font-weight: bold;\">📊 Launchly: Your Statistics Report</h2>" +
                            "  <p style=\"color: #475569; font-size: 14px;\">Here is the summary of your bots' activity for the past <strong>%d days</strong>.</p>" +
                            "  " +
                            "  <div style=\"display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 20px 0;\">" +
                            "    <div style=\"background-color: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #f1f5f9; text-align: center;\">" +
                            "      <span style=\"font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;\">Total Subscribers</span>" +
                            "      <h3 style=\"margin: 8px 0 0 0; color: #1e293b; font-size: 24px; font-weight: bold;\">%d</h3>" +
                            "    </div>" +
                            "    <div style=\"background-color: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #f1f5f9; text-align: center;\">" +
                            "      <span style=\"font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;\">Active Users (24h)</span>" +
                            "      <h3 style=\"margin: 8px 0 0 0; color: #1e293b; font-size: 24px; font-weight: bold;\">%d</h3>" +
                            "    </div>" +
                            "    <div style=\"background-color: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #f1f5f9; text-align: center;\">" +
                            "      <span style=\"font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;\">Total Clicks (30d)</span>" +
                            "      <h3 style=\"margin: 8px 0 0 0; color: #1e293b; font-size: 24px; font-weight: bold;\">%d</h3>" +
                            "    </div>" +
                            "    <div style=\"background-color: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #f1f5f9; text-align: center;\">" +
                            "      <span style=\"font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;\">Active Automations</span>" +
                            "      <h3 style=\"margin: 8px 0 0 0; color: #1e293b; font-size: 24px; font-weight: bold;\">%d</h3>" +
                            "    </div>" +
                            "  </div>" +
                            "" +
                            "  <h3 style=\"color: #1e293b; font-size: 16px; margin: 24px 0 12px 0; border-left: 4px solid #2563eb; padding-left: 8px; font-weight: bold;\">🔥 Top 5 Clicked Buttons</h3>" +
                            "  %s" +
                            "  " +
                            "  <div style=\"text-align: center; margin-top: 30px;\">" +
                            "    <a href=\"%s\" style=\"display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: bold;\">🌐 View Full Dashboard</a>" +
                            "  </div>" +
                            "</div>",
                            user.getStatsDaysRange(),
                            stats.totalSubscribers(),
                            stats.activeUsers24h(),
                            stats.clicksCount30d(),
                            stats.activeAutomations(),
                            topButtonsHtml.toString(),
                            statsUrl
                        );

                        helper.setText(htmlMsg, true);
                        mailSender.send(mimeMessage);
                        log.info("Sent statistics report email to {}", toEmail);
                    } catch (Exception e) {
                        log.error("Failed to send statistics report email to {}: {}", toEmail, e.getMessage());
                    }
                }
            }
        }

        if (user.isStatsNotifyTelegram() && user.getTelegramUserId() != null) {
            TelegramBotManager botManager = botManagerProvider.getIfAvailable();
            TelegramClient systemBotClient = botManager != null ? botManager.getTelegramClient(-1L) : null;
            if (systemBotClient != null) {
                try {
                    String telegramHtmlMessage = String.format(
                            "📊 <b>Launchly Statistics Report (Past %d days)</b>\n\n" +
                            "👤 <b>Total Subscribers:</b> %d\n" +
                            "👥 <b>Active Users (24h):</b> %d\n" +
                            "⚡ <b>Total Clicks (30d):</b> %d\n" +
                            "🤖 <b>Active Automations:</b> %d\n\n" +
                            "🔥 <b>Top Clicked Buttons:</b>\n%s",
                            user.getStatsDaysRange(),
                            stats.totalSubscribers(),
                            stats.activeUsers24h(),
                            stats.clicksCount30d(),
                            stats.activeAutomations(),
                            topButtonsTg.toString()
                    );

                    List<InlineKeyboardRow> keyboard = new ArrayList<>();
                    InlineKeyboardRow row = new InlineKeyboardRow();

                    String telegramUrl = statsUrl;
                    if (telegramUrl.contains("localhost") || telegramUrl.contains("127.0.0.1")) {
                        telegramUrl = telegramUrl.replace("localhost", "lvh.me")
                                                 .replace("127.0.0.1", "lvh.me");
                    }

                    row.add(InlineKeyboardButton.builder()
                            .text("🌐 Open Dashboard")
                            .url(telegramUrl)
                            .build());
                    keyboard.add(row);

                    InlineKeyboardMarkup keyboardMarkup = InlineKeyboardMarkup.builder()
                            .keyboard(keyboard)
                            .build();

                    SendMessage sendMessage = SendMessage.builder()
                            .chatId(user.getTelegramUserId().toString())
                            .text(telegramHtmlMessage)
                            .parseMode("HTML")
                            .replyMarkup(keyboardMarkup)
                            .build();

                    systemBotClient.execute(sendMessage);
                    log.info("Sent statistics report Telegram to user {}", user.getTelegramUserId());
                } catch (Exception e) {
                    log.error("Failed to send statistics report Telegram to {}: {}", user.getTelegramUserId(), e.getMessage());
                }
            }
        }
    }
}
