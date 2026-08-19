package com.launchly.support.mapper;

import com.launchly.admin.dto.SupportMessageDto;
import com.launchly.admin.dto.SupportTicketDto;
import com.launchly.admin.entity.SupportMessage;
import com.launchly.admin.entity.SupportTicket;
import com.launchly.auth.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class SupportMapperTest {

    private SupportMapper supportMapper;

    @BeforeEach
    void setUp() {
        supportMapper = Mappers.getMapper(SupportMapper.class);
    }

    @Test
    @DisplayName("Should map SupportTicket entity to SupportTicketDto with manager and user details")
    void toDto_Success() {
        User user = User.builder().name("John Doe").email("john@example.com").build();
        ReflectionTestUtils.setField(user, "id", 1L);

        User manager = User.builder().name("Support Agent").email("agent@launchly.pro").build();
        ReflectionTestUtils.setField(manager, "id", 2L);

        SupportTicket ticket = SupportTicket.builder()
                .subject("Billing Inquiry")
                .status("OPEN")
                .user(user)
                .assignedManager(manager)
                .unreadForAdmin(true)
                .unreadForUser(false)
                .isFavorite(true)
                .build();
        ReflectionTestUtils.setField(ticket, "id", 100L);
        ReflectionTestUtils.setField(ticket, "createdAt", LocalDateTime.now());

        SupportTicketDto dto = supportMapper.toDto(ticket);

        assertThat(dto).isNotNull();
        assertThat(dto.getId()).isEqualTo(100L);
        assertThat(dto.getUserName()).isEqualTo("John Doe");
        assertThat(dto.getAssignedManagerName()).isEqualTo("Support Agent");
        assertThat(dto.getUnread()).isTrue();
    }

    @Test
    @DisplayName("Should map SupportMessage to SupportMessageDto")
    void toMessageDto_Success() {
        SupportTicket ticket = SupportTicket.builder().build();
        ReflectionTestUtils.setField(ticket, "id", 100L);

        SupportMessage message = SupportMessage.builder()
                .ticket(ticket)
                .text("Need help with Telegram bot setup")
                .senderType("USER")
                .build();
        ReflectionTestUtils.setField(message, "id", 50L);

        SupportMessageDto dto = supportMapper.toMessageDto(message);

        assertThat(dto).isNotNull();
        assertThat(dto.getId()).isEqualTo(50L);
        assertThat(dto.getTicketId()).isEqualTo(100L);
        assertThat(dto.getText()).isEqualTo("Need help with Telegram bot setup");
        assertThat(dto.getSender()).isEqualTo("USER");
    }
}
