package com.launchly.support.service;

import com.launchly.support.dto.SupportMessageDto;
import com.launchly.support.dto.SupportTicketDto;
import com.launchly.support.dto.CreateTicketRequest;
import org.springframework.data.domain.Page;

public interface UserSupportChatService {
    Page<SupportTicketDto> getUserTickets(String userEmail, int page, int size);
    SupportTicketDto getUserTicketDetail(Long id, String userEmail);
    SupportTicketDto createTicket(CreateTicketRequest request, String userEmail);
    SupportMessageDto addMessage(Long ticketId, String text, String userEmail);
    SupportTicketDto updateStatus(Long id, String status, String userEmail);
}
