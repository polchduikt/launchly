package com.launchly.support.service.impl;

import com.launchly.admin.dto.SupportMessageDto;
import com.launchly.admin.dto.SupportTicketDto;
import com.launchly.admin.entity.SupportMessage;
import com.launchly.admin.entity.SupportTicket;
import com.launchly.admin.repository.SupportMessageRepository;
import com.launchly.admin.repository.SupportTicketRepository;
import com.launchly.auth.entity.User;
import com.launchly.auth.service.UserQueryService;
import com.launchly.common.exception.AppException;
import com.launchly.common.utils.MessageUtils;
import com.launchly.support.dto.CreateTicketRequest;
import com.launchly.support.mapper.SupportMapper;
import com.launchly.support.service.UserSupportChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserSupportChatServiceImpl implements UserSupportChatService {

    private final SupportTicketRepository supportTicketRepository;
    private final SupportMessageRepository supportMessageRepository;
    private final UserQueryService userQueryService;
    private final SupportMapper supportMapper;
    private final MessageUtils messageUtils;

    @Override
    @Transactional(readOnly = true)
    public Page<SupportTicketDto> getUserTickets(String userEmail, int page, int size) {
        User user = findUserByEmailOrThrow(userEmail);
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        Page<SupportTicket> ticketPage = supportTicketRepository.findByUserId(user.getId(), pageable);

        List<SupportTicketDto> dtos = ticketPage.getContent().stream()
                .map(supportMapper::toDto)
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, ticketPage.getTotalElements());
    }

    @Override
    @Transactional
    public SupportTicketDto getUserTicketDetail(Long id, String userEmail) {
        User user = findUserByEmailOrThrow(userEmail);
        SupportTicket ticket = findTicketOrThrow(id);

        if (!ticket.getUser().getId().equals(user.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, messageUtils.getMessage("common.error.access_denied"));
        }

        if (Boolean.TRUE.equals(ticket.getUnreadForUser())) {
            ticket.setUnreadForUser(false);
            supportTicketRepository.save(ticket);
        }

        return supportMapper.toDto(ticket);
    }

    @Override
    @Transactional
    public SupportTicketDto createTicket(CreateTicketRequest request, String userEmail) {
        User user = findUserByEmailOrThrow(userEmail);

        SupportTicket ticket = SupportTicket.builder()
                .user(user)
                .subject(request.getSubject().trim())
                .status("ACTIVE")
                .unreadForAdmin(true)
                .isFavorite(false)
                .lastMessage(request.getMessage().trim())
                .messages(new ArrayList<>())
                .build();

        ticket = supportTicketRepository.save(ticket);

        String senderName = user.getName() != null && !user.getName().isBlank() ? user.getName() : user.getEmail();

        SupportMessage message = SupportMessage.builder()
                .ticket(ticket)
                .sender(user)
                .senderType("USER")
                .senderName(senderName)
                .text(request.getMessage().trim())
                .build();

        supportMessageRepository.save(message);
        ticket.getMessages().add(message);

        return supportMapper.toDto(ticket);
    }

    @Override
    @Transactional
    public SupportMessageDto addMessage(Long ticketId, String text, String userEmail) {
        User user = findUserByEmailOrThrow(userEmail);
        SupportTicket ticket = findTicketOrThrow(ticketId);

        if (!ticket.getUser().getId().equals(user.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, messageUtils.getMessage("common.error.access_denied"));
        }

        if ("CLOSED".equalsIgnoreCase(ticket.getStatus())) {
            throw new AppException(HttpStatus.BAD_REQUEST, messageUtils.getMessage("admin.support.dialog_closed_err"));
        }

        String senderName = user.getName() != null && !user.getName().isBlank() ? user.getName() : user.getEmail();

        SupportMessage message = SupportMessage.builder()
                .ticket(ticket)
                .sender(user)
                .senderType("USER")
                .senderName(senderName)
                .text(text.trim())
                .build();

        supportMessageRepository.save(message);

        ticket.updateLastMessage(text.trim(), true, false);
        if ("RESOLVED".equalsIgnoreCase(ticket.getStatus())) {
            ticket.reopen();
        }
        ticket.setUpdatedAt(LocalDateTime.now());
        supportTicketRepository.save(ticket);

        return supportMapper.toMessageDto(message);
    }

    @Override
    @Transactional
    public SupportTicketDto updateStatus(Long id, String targetStatus, String userEmail) {
        User user = findUserByEmailOrThrow(userEmail);
        SupportTicket ticket = findTicketOrThrow(id);

        if (!ticket.getUser().getId().equals(user.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, messageUtils.getMessage("common.error.access_denied"));
        }

        String statusToSet = (targetStatus != null && !targetStatus.isBlank()) ? targetStatus.toUpperCase() : "RESOLVED";
        ticket.setStatus(statusToSet);
        ticket.setUpdatedAt(LocalDateTime.now());
        supportTicketRepository.save(ticket);
        return supportMapper.toDto(ticket);
    }

    private User findUserByEmailOrThrow(String email) {
        return userQueryService.getUserByEmailOrThrow(email);
    }

    private SupportTicket findTicketOrThrow(Long id) {
        return supportTicketRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, messageUtils.getMessage("common.error.not_found")));
    }
}
