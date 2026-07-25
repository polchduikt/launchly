package com.launchly.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportTicketDto {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String userAvatar;
    private String userPlan;
    private String userRole;
    private Boolean unread;
    private Boolean isFavorite;
    private String status;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private List<SupportMessageDto> messages;
    private Long botsCount;
    private Long automationsCount;
    private Long broadcastsCount;
    private Long contactsCount;
    private Long messagesCount;
    private LocalDateTime registeredAt;
    private LocalDateTime lastActivityAt;
    private Boolean accountActive;
    private Long telegramUserId;
    private String authProvider;
    private Long assignedManagerId;
    private String assignedManagerName;
    private String assignedManagerEmail;
}
