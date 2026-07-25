package com.launchly.admin.service.impl;

import com.launchly.admin.dto.SupportMessageDto;
import com.launchly.admin.dto.SupportTicketDto;
import com.launchly.admin.entity.SupportMessage;
import com.launchly.admin.entity.SupportTicket;
import com.launchly.admin.repository.SupportMessageRepository;
import com.launchly.admin.repository.SupportTicketRepository;
import com.launchly.admin.service.AdminSupportChatService;
import com.launchly.auth.entity.User;
import com.launchly.auth.repository.UserRepository;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.repository.FlowSchemaRepository;
import com.launchly.broadcast.repository.BroadcastCampaignRepository;
import com.launchly.billing.entity.SubscriptionStatus;
import com.launchly.billing.repository.SubscriptionRepository;
import com.launchly.common.utils.MessageUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminSupportChatServiceImpl implements AdminSupportChatService {

    private final SupportTicketRepository supportTicketRepository;
    private final SupportMessageRepository supportMessageRepository;
    private final UserRepository userRepository;
    private final BotRepository botRepository;
    private final BotUserRepository botUserRepository;
    private final FlowSchemaRepository flowSchemaRepository;
    private final BroadcastCampaignRepository broadcastCampaignRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final MessageUtils messageUtils;

    @Override
    @Transactional
    public Page<SupportTicketDto> getSupportTickets(String filter, String period, String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());

        Specification<SupportTicket> spec = buildTicketSpec(filter, period, search);
        Page<SupportTicket> ticketsPage = supportTicketRepository.findAll(spec, pageable);

        List<SupportTicketDto> dtos = ticketsPage.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, ticketsPage.getTotalElements());
    }

    @Override
    @Transactional
    public SupportTicketDto getSupportTicketDetail(Long id) {
        SupportTicket ticket = findTicketOrThrow(id);

        if (Boolean.TRUE.equals(ticket.getUnreadForAdmin())) {
            ticket.setUnreadForAdmin(false);
            supportTicketRepository.save(ticket);
        }

        return mapToDto(ticket);
    }

    @Override
    @Transactional
    public SupportMessageDto addMessage(Long ticketId, String text, String managerEmail) {
        SupportTicket ticket = findTicketOrThrow(ticketId);

        if ("RESOLVED".equalsIgnoreCase(ticket.getStatus()) || "CLOSED".equalsIgnoreCase(ticket.getStatus())) {
            throw new IllegalStateException(messageUtils.getMessage("admin.support.dialog_closed_err"));
        }

        if (ticket.getAssignedManager() == null) {
            throw new IllegalStateException(messageUtils.getMessage("admin.support.start_dialog_first_err"));
        }

        if (!ticket.getAssignedManager().getEmail().equalsIgnoreCase(managerEmail)) {
            String mName = ticket.getAssignedManager().getName() != null ? ticket.getAssignedManager().getName() : ticket.getAssignedManager().getEmail();
            throw new IllegalStateException(messageUtils.getMessage("admin.support.dialog_other_manager_err", mName));
        }

        User manager = userRepository.findByEmail(managerEmail).orElse(null);

        SupportMessage message = SupportMessage.builder()
                .ticket(ticket)
                .sender(manager)
                .senderType("MANAGER")
                .senderName(messageUtils.getMessage("admin.support_team"))
                .text(text)
                .build();

        supportMessageRepository.save(message);

        ticket.setLastMessage(text);
        ticket.setUnreadForAdmin(false);
        ticket.setUpdatedAt(LocalDateTime.now());
        supportTicketRepository.save(ticket);

        return SupportMessageDto.builder()
                .id(message.getId())
                .ticketId(ticket.getId())
                .sender(message.getSenderType())
                .senderName(message.getSenderName())
                .text(message.getText())
                .timestamp(message.getCreatedAt() != null ? message.getCreatedAt() : LocalDateTime.now())
                .build();
    }

    @Override
    @Transactional
    public SupportTicketDto toggleFavorite(Long id) {
        SupportTicket ticket = findTicketOrThrow(id);
        ticket.setIsFavorite(!Boolean.TRUE.equals(ticket.getIsFavorite()));
        supportTicketRepository.save(ticket);
        return mapToDto(ticket);
    }

    @Override
    @Transactional
    public SupportTicketDto updateStatus(Long id, String targetStatus) {
        SupportTicket ticket = findTicketOrThrow(id);
        String statusToSet = (targetStatus != null && !targetStatus.isBlank()) ? targetStatus.toUpperCase() : "RESOLVED";
        ticket.setStatus(statusToSet);
        ticket.setUpdatedAt(LocalDateTime.now());
        supportTicketRepository.save(ticket);
        return mapToDto(ticket);
    }

    @Override
    @Transactional
    public SupportTicketDto claimTicket(Long ticketId, String managerEmail) {
        SupportTicket ticket = findTicketOrThrow(ticketId);

        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Manager not found: " + managerEmail));

        if (ticket.getAssignedManager() != null && !ticket.getAssignedManager().getEmail().equalsIgnoreCase(managerEmail)) {
            String mName = ticket.getAssignedManager().getName() != null ? ticket.getAssignedManager().getName() : ticket.getAssignedManager().getEmail();
            throw new IllegalStateException(messageUtils.getMessage("admin.support.dialog_already_claimed_err", mName));
        }

        ticket.setAssignedManager(manager);

        String managerName = manager.getName() != null ? manager.getName() : manager.getEmail();
        String systemMsgText = messageUtils.getMessage("admin.support.manager_joined_msg", managerName);

        SupportMessage systemMsg = SupportMessage.builder()
                .ticket(ticket)
                .sender(manager)
                .senderType("SYSTEM")
                .senderName(messageUtils.getMessage("admin.support.system_sender_name"))
                .text(systemMsgText)
                .build();

        supportMessageRepository.save(systemMsg);

        ticket.setLastMessage(systemMsgText);
        ticket.setUpdatedAt(LocalDateTime.now());
        supportTicketRepository.save(ticket);

        return mapToDto(ticket);
    }

    private SupportTicket findTicketOrThrow(Long id) {
        return supportTicketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + id));
    }

    private Specification<SupportTicket> buildTicketSpec(String filter, String period, String search) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter != null && filter.equalsIgnoreCase("completed")) {
                predicates.add(cb.equal(root.get("status"), "CLOSED"));
            } else if (filter != null && filter.equalsIgnoreCase("resolved")) {
                predicates.add(cb.equal(root.get("status"), "RESOLVED"));
            } else {
                predicates.add(cb.and(
                        cb.notEqual(root.get("status"), "RESOLVED"),
                        cb.notEqual(root.get("status"), "CLOSED")
                ));
                if (filter != null && !filter.isEmpty() && !"all".equalsIgnoreCase(filter)) {
                    if ("unread".equalsIgnoreCase(filter)) {
                        predicates.add(cb.equal(root.get("unreadForAdmin"), true));
                    } else if ("favorites".equalsIgnoreCase(filter)) {
                        predicates.add(cb.equal(root.get("isFavorite"), true));
                    } else if ("active".equalsIgnoreCase(filter)) {
                        predicates.add(cb.equal(root.get("status"), "ACTIVE"));
                    }
                }
            }

            if (period != null && !period.isEmpty() && !"all".equalsIgnoreCase(period)) {
                LocalDate today = LocalDate.now();
                if ("today".equalsIgnoreCase(period)) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("updatedAt"), today.atStartOfDay()));
                } else if ("yesterday".equalsIgnoreCase(period)) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("updatedAt"), today.minusDays(1).atStartOfDay()));
                    predicates.add(cb.lessThan(root.get("updatedAt"), today.atStartOfDay()));
                } else if ("week".equalsIgnoreCase(period)) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("updatedAt"), today.minusDays(7).atStartOfDay()));
                } else if ("month".equalsIgnoreCase(period)) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("updatedAt"), today.minusDays(30).atStartOfDay()));
                }
            }

            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.toLowerCase().trim() + "%";
                Join<SupportTicket, User> userJoin = root.join("user");
                predicates.add(cb.or(
                        cb.like(cb.lower(userJoin.get("name")), searchPattern),
                        cb.like(cb.lower(userJoin.get("email")), searchPattern),
                        cb.like(cb.lower(root.get("lastMessage")), searchPattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private SupportTicketDto mapToDto(SupportTicket ticket) {
        User u = ticket.getUser();

        String planName = "FREE";
        if (u != null) {
            planName = subscriptionRepository.findByUserId(u.getId())
                    .filter(s -> s.getStatus() == SubscriptionStatus.ACTIVE)
                    .map(s -> s.getPlan() != null ? s.getPlan().getDisplayName() : "FREE")
                    .orElse("FREE");
        }

        long botsCount = u != null ? botRepository.countByUserId(u.getId()) : 0;
        long automationsCount = u != null ? flowSchemaRepository.countByUserId(u.getId()) : 0;
        long broadcastsCount = u != null ? broadcastCampaignRepository.countByUserId(u.getId()) : 0;
        long contactsCount = 0;
        if (u != null) {
            List<Long> botIds = botRepository.findByUserId(u.getId()).stream()
                    .map(b -> b.getId())
                    .collect(Collectors.toList());
            if (!botIds.isEmpty()) {
                contactsCount = botUserRepository.countByBotIdIn(botIds);
            }
        }

        List<SupportMessageDto> messageDtos = ticket.getMessages().stream()
                .map(m -> SupportMessageDto.builder()
                        .id(m.getId())
                        .ticketId(ticket.getId())
                        .sender(m.getSenderType())
                        .senderName(m.getSenderName())
                        .text(m.getText())
                        .timestamp(m.getCreatedAt() != null ? m.getCreatedAt() : LocalDateTime.now())
                        .build())
                .collect(Collectors.toList());

        User mgr = ticket.getAssignedManager();

        return SupportTicketDto.builder()
                .id(ticket.getId())
                .userId(u != null ? u.getId() : 0L)
                .userName(u != null && u.getName() != null && !u.getName().isBlank() ? u.getName() : messageUtils.getMessage("admin.user_fallback"))
                .userEmail(u != null ? u.getEmail() : "")
                .userAvatar(u != null ? u.getAvatar() : null)
                .userPlan(planName)
                .userRole(u != null && u.getRole() != null ? u.getRole().name() : "ROLE_OWNER")
                .unread(ticket.getUnreadForAdmin())
                .isFavorite(ticket.getIsFavorite())
                .status(ticket.getStatus())
                .lastMessage(ticket.getLastMessage())
                .lastMessageTime(ticket.getUpdatedAt() != null ? ticket.getUpdatedAt() : ticket.getCreatedAt())
                .messages(messageDtos)
                .botsCount(botsCount)
                .automationsCount(automationsCount)
                .broadcastsCount(broadcastsCount)
                .contactsCount(contactsCount)
                .messagesCount(0L)
                .registeredAt(u != null ? u.getCreatedAt() : ticket.getCreatedAt())
                .lastActivityAt(u != null && u.getUpdatedAt() != null ? u.getUpdatedAt() : ticket.getUpdatedAt())
                .accountActive(u == null || u.isActive())
                .telegramUserId(u != null ? u.getTelegramUserId() : null)
                .authProvider(u != null && u.getProvider() != null ? u.getProvider().name() : "LOCAL")
                .assignedManagerId(mgr != null ? mgr.getId() : null)
                .assignedManagerName(mgr != null && mgr.getName() != null ? mgr.getName() : (mgr != null ? mgr.getEmail() : null))
                .assignedManagerEmail(mgr != null ? mgr.getEmail() : null)
                .build();
    }
}
