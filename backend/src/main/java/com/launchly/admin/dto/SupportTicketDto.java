package com.launchly.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Schema(description = "Customer support ticket and conversation details")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportTicketDto {
    @Schema(description = "Ticket ID", example = "101")
    private Long id;

    @Schema(description = "User ID", example = "12")
    private Long userId;

    @Schema(description = "User display name", example = "Alex Smith")
    private String userName;

    @Schema(description = "User email address", example = "alex@example.com")
    private String userEmail;

    @Schema(description = "User avatar URL")
    private String userAvatar;

    @Schema(description = "Subscription plan name", example = "PRO")
    private String userPlan;

    @Schema(description = "User role", example = "ROLE_USER")
    private String userRole;

    @Schema(description = "Whether ticket has unread messages for manager", example = "true")
    private Boolean unread;

    @Schema(description = "Whether ticket has unread messages for user", example = "false")
    private Boolean unreadForUser;

    @Schema(description = "Whether ticket is marked as favorite by manager", example = "false")
    private Boolean isFavorite;

    @Schema(description = "Ticket status: OPEN, PENDING, CLOSED", example = "OPEN")
    private String status;

    @Schema(description = "Preview of the most recent message in chat")
    private String lastMessage;

    @Schema(description = "Timestamp of the last message")
    private LocalDateTime lastMessageTime;

    @Schema(description = "List of messages in ticket dialogue")
    private List<SupportMessageDto> messages;

    @Schema(description = "Total bots created by user", example = "2")
    private Long botsCount;

    @Schema(description = "Total automations created by user", example = "8")
    private Long automationsCount;

    @Schema(description = "Total broadcasts created by user", example = "4")
    private Long broadcastsCount;

    @Schema(description = "Total contacts collected", example = "520")
    private Long contactsCount;

    @Schema(description = "Total messages exchanged", example = "1200")
    private Long messagesCount;

    @Schema(description = "User registration date")
    private LocalDateTime registeredAt;

    @Schema(description = "User last activity date")
    private LocalDateTime lastActivityAt;

    @Schema(description = "Whether user account is active")
    private Boolean accountActive;

    @Schema(description = "User Telegram ID if linked")
    private Long telegramUserId;

    @Schema(description = "Auth provider: LOCAL, GOOGLE, TELEGRAM")
    private String authProvider;

    @Schema(description = "Assigned support manager ID")
    private Long assignedManagerId;

    @Schema(description = "Assigned support manager name")
    private String assignedManagerName;

    @Schema(description = "Assigned support manager email")
    private String assignedManagerEmail;

    @Schema(description = "Time when ticket was claimed by manager")
    private LocalDateTime claimedAt;


    @Schema(description = "Reason provided in block appeal if applicable")
    private String appealReason;
}

