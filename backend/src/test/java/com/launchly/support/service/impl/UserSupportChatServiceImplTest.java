package com.launchly.support.service.impl;

import com.launchly.admin.dto.SupportTicketDto;
import com.launchly.admin.entity.SupportTicket;
import com.launchly.admin.repository.SupportMessageRepository;
import com.launchly.admin.repository.SupportTicketRepository;
import com.launchly.auth.entity.User;
import com.launchly.auth.service.UserQueryService;
import com.launchly.common.utils.MessageUtils;
import com.launchly.support.mapper.SupportMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserSupportChatServiceImplTest {

    @Mock
    private SupportTicketRepository supportTicketRepository;

    @Mock
    private SupportMessageRepository supportMessageRepository;

    @Mock
    private UserQueryService userQueryService;

    @Mock
    private SupportMapper supportMapper;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private UserSupportChatServiceImpl supportChatService;

    private User testUser;
    private SupportTicket testTicket;
    private SupportTicketDto mockTicketDto;

    @BeforeEach
    void setUp() {
        testUser = User.builder().email("user@test.com").name("User").build();
        ReflectionTestUtils.setField(testUser, "id", 1L);

        testTicket = SupportTicket.builder()
                .subject("Help with Bot")
                .status("ACTIVE")
                .user(testUser)
                .build();
        ReflectionTestUtils.setField(testTicket, "id", 100L);

        mockTicketDto = mock(SupportTicketDto.class);
    }

    @Test
    @DisplayName("Should return paginated tickets for user")
    void getUserTickets_ReturnsPage() {
        when(userQueryService.getUserByEmailOrThrow("user@test.com")).thenReturn(testUser);
        when(supportTicketRepository.findByUserId(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(testTicket)));
        when(supportMapper.toDto(testTicket)).thenReturn(mockTicketDto);

        Page<SupportTicketDto> page = supportChatService.getUserTickets("user@test.com", 0, 10);

        assertThat(page).isNotEmpty();
        assertThat(page.getTotalElements()).isEqualTo(1);
    }

    @Test
    @DisplayName("Should return ticket details for owner")
    void getUserTicketDetail_WhenOwner_ReturnsDto() {
        when(userQueryService.getUserByEmailOrThrow("user@test.com")).thenReturn(testUser);
        when(supportTicketRepository.findById(100L)).thenReturn(Optional.of(testTicket));
        when(supportMapper.toDto(testTicket)).thenReturn(mockTicketDto);

        SupportTicketDto result = supportChatService.getUserTicketDetail(100L, "user@test.com");

        assertThat(result).isNotNull();
    }
}
