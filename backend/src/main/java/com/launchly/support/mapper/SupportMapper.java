package com.launchly.support.mapper;

import com.launchly.admin.dto.SupportMessageDto;
import com.launchly.admin.dto.SupportTicketDto;
import com.launchly.admin.entity.SupportMessage;
import com.launchly.admin.entity.SupportTicket;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;
import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface SupportMapper {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userName", expression = "java(ticket.getUser() != null && ticket.getUser().getName() != null && !ticket.getUser().getName().isBlank() ? ticket.getUser().getName() : (ticket.getUser() != null ? ticket.getUser().getEmail() : \"\"))")
    @Mapping(target = "userEmail", source = "user.email")
    @Mapping(target = "userAvatar", source = "user.avatar")
    @Mapping(target = "unread", source = "unreadForAdmin")
    @Mapping(target = "unreadForUser", source = "unreadForUser")
    @Mapping(target = "isFavorite", source = "isFavorite")
    @Mapping(target = "registeredAt", source = "createdAt")
    @Mapping(target = "lastActivityAt", source = "updatedAt")
    @Mapping(target = "lastMessageTime", expression = "java(ticket.getUpdatedAt() != null ? ticket.getUpdatedAt() : ticket.getCreatedAt())")
    @Mapping(target = "assignedManagerId", source = "assignedManager.id")
    @Mapping(target = "assignedManagerName", expression = "java(ticket.getAssignedManager() != null && ticket.getAssignedManager().getName() != null ? ticket.getAssignedManager().getName() : (ticket.getAssignedManager() != null ? ticket.getAssignedManager().getEmail() : null))")
    @Mapping(target = "assignedManagerEmail", source = "assignedManager.email")
    @Mapping(target = "messages", source = "messages")
    SupportTicketDto toDto(SupportTicket ticket);

    List<SupportTicketDto> toTicketDtoList(List<SupportTicket> tickets);

    @Mapping(target = "ticketId", source = "ticket.id")
    @Mapping(target = "sender", source = "senderType")
    @Mapping(target = "timestamp", expression = "java(message.getCreatedAt() != null ? message.getCreatedAt() : java.time.LocalDateTime.now())")
    SupportMessageDto toMessageDto(SupportMessage message);

    List<SupportMessageDto> toMessageDtoList(List<SupportMessage> messages);
}
