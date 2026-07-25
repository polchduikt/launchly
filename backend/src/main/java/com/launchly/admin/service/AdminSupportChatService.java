package com.launchly.admin.service;

import com.launchly.admin.dto.SupportMessageDto;
import com.launchly.admin.dto.SupportTicketDto;
import org.springframework.data.domain.Page;

public interface AdminSupportChatService {
    Page<SupportTicketDto> getSupportTickets(String filter, String period, String search, int page, int size);
    SupportTicketDto getSupportTicketDetail(Long id);
    SupportMessageDto addMessage(Long ticketId, String text, String managerEmail);
    SupportTicketDto toggleFavorite(Long id);
    SupportTicketDto updateStatus(Long id, String status);
    SupportTicketDto claimTicket(Long id, String managerEmail);
}
