package com.launchly.admin.service;

import com.launchly.support.dto.SupportMessageDto;
import com.launchly.support.dto.SupportTicketDto;
import com.launchly.support.enums.TicketStatus;
import org.springframework.data.domain.Page;

public interface AdminSupportChatService {
    Page<SupportTicketDto> getSupportTickets(String filter, String period, String search, int page, int size);
    SupportTicketDto getSupportTicketDetail(Long id);
    SupportMessageDto addMessage(Long ticketId, String text, String managerEmail);
    SupportTicketDto toggleFavorite(Long id);
    SupportTicketDto updateStatus(Long id, TicketStatus status);
    SupportTicketDto claimTicket(Long id, String managerEmail);
}
