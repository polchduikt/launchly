package com.launchly.admin.service.impl;

import com.launchly.admin.dto.AdminBlockRequest;
import com.launchly.admin.dto.AdminUserDto;
import com.launchly.admin.mapper.AdminMapper;
import com.launchly.admin.repository.UserAuditLogRepository;
import com.launchly.admin.service.UserAuditService;
import com.launchly.admin.util.AdminPeriodResolver;
import com.launchly.admin.validator.BotTokenValidator;
import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import com.launchly.auth.service.UserQueryService;
import com.launchly.billing.repository.SubscriptionRepository;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.repository.FlowSchemaRepository;
import com.launchly.broadcast.repository.BroadcastCampaignRepository;
import com.launchly.common.exception.AppException;
import com.launchly.common.utils.MessageUtils;
import com.launchly.crm.repository.ConversationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceImplTest {

    @Mock
    private UserQueryService userQueryService;

    @Mock
    private BotRepository botRepository;

    @Mock
    private FlowSchemaRepository flowSchemaRepository;

    @Mock
    private BroadcastCampaignRepository broadcastCampaignRepository;

    @Mock
    private BotUserRepository botUserRepository;

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private UserAuditLogRepository userAuditLogRepository;

    @Mock
    private UserAuditService userAuditService;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private BotTokenValidator botTokenValidator;

    @Mock
    private AdminPeriodResolver periodResolver;

    @Mock
    private AdminMapper adminMapper;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private AdminUserServiceImpl adminUserService;

    private User targetUser;
    private AdminUserDto mockUserDto;

    @BeforeEach
    void setUp() {
        targetUser = User.builder()
                .email("target@example.com")
                .name("Target")
                .role(Role.ROLE_MANAGER)
                .active(true)
                .build();
        ReflectionTestUtils.setField(targetUser, "id", 10L);

        mockUserDto = mock(AdminUserDto.class);
    }

    // ==========================================
    // 1. UPDATE USER ROLE
    // ==========================================

    @Test
    @DisplayName("Should successfully update user role when not self-modifying")
    void updateUserRole_Success() {
        when(userQueryService.getUserOrThrow(10L)).thenReturn(targetUser);
        when(userQueryService.save(any(User.class))).thenReturn(targetUser);
        when(botRepository.findByUserId(10L)).thenReturn(Collections.emptyList());
        when(subscriptionRepository.findByUserId(10L)).thenReturn(Optional.empty());
        when(adminMapper.toUserDto(any(), anyInt(), anyLong(), anyLong(), anyLong(), anyLong(), anyString()))
                .thenReturn(mockUserDto);

        AdminUserDto result = adminUserService.updateUserRole(10L, Role.ROLE_ADMIN, "admin@launchly.pro");

        assertThat(result).isNotNull();
        assertThat(targetUser.getRole()).isEqualTo(Role.ROLE_ADMIN);
        verify(userAuditService, times(1)).logRoleChanged(eq(targetUser), eq("ROLE_ADMIN"));
    }

    @Test
    @DisplayName("Should throw BadRequest when admin tries to change their own role")
    void updateUserRole_SelfModification_ThrowsBadRequest() {
        when(userQueryService.getUserOrThrow(10L)).thenReturn(targetUser);

        assertThatThrownBy(() -> adminUserService.updateUserRole(10L, Role.ROLE_ADMIN, "target@example.com"))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    // ==========================================
    // 2. TOGGLE USER STATUS (BLOCK / UNBLOCK)
    // ==========================================

    @Test
    @DisplayName("Should block active user with specified reason")
    void toggleUserStatus_WhenActive_BlocksUser() {
        AdminBlockRequest request = new AdminBlockRequest("Spam Violation", "Mass broadcasting prohibited spam");
        when(userQueryService.getUserOrThrow(10L)).thenReturn(targetUser);
        when(userQueryService.save(any(User.class))).thenReturn(targetUser);
        when(botRepository.findByUserId(10L)).thenReturn(Collections.emptyList());
        when(subscriptionRepository.findByUserId(10L)).thenReturn(Optional.empty());
        when(adminMapper.toUserDto(any(), anyInt(), anyLong(), anyLong(), anyLong(), anyLong(), anyString()))
                .thenReturn(mockUserDto);

        AdminUserDto result = adminUserService.toggleUserStatus(10L, request);

        assertThat(result).isNotNull();
        assertThat(targetUser.isActive()).isFalse();
        verify(userAuditService, times(1)).logUserBlocked(eq(targetUser), contains("Spam Violation"));
    }

    @Test
    @DisplayName("Should unblock previously blocked user")
    void toggleUserStatus_WhenBlocked_UnblocksUser() {
        targetUser.setActive(false);
        targetUser.setBlockReason("Past violation");

        when(userQueryService.getUserOrThrow(10L)).thenReturn(targetUser);
        when(userQueryService.save(any(User.class))).thenReturn(targetUser);
        when(botRepository.findByUserId(10L)).thenReturn(Collections.emptyList());
        when(subscriptionRepository.findByUserId(10L)).thenReturn(Optional.empty());
        when(adminMapper.toUserDto(any(), anyInt(), anyLong(), anyLong(), anyLong(), anyLong(), anyString()))
                .thenReturn(mockUserDto);

        AdminUserDto result = adminUserService.toggleUserStatus(10L, null);

        assertThat(result).isNotNull();
        assertThat(targetUser.isActive()).isTrue();
        assertThat(targetUser.getBlockReason()).isNull();
        verify(userAuditService, times(1)).logUserUnblocked(eq(targetUser));
    }

    // ==========================================
    // 3. GET USERS LISTING
    // ==========================================

    @Test
    @DisplayName("Should return paginated users filtered by role and search")
    void getUsers_WithFilters_ReturnsPage() {
        when(userQueryService.findAllUsers()).thenReturn(List.of(targetUser));
        when(botRepository.findByUserId(10L)).thenReturn(Collections.emptyList());
        when(subscriptionRepository.findByUserId(10L)).thenReturn(Optional.empty());
        when(adminMapper.toUserDto(any(), anyInt(), anyLong(), anyLong(), anyLong(), anyLong(), anyString()))
                .thenReturn(mockUserDto);

        Page<AdminUserDto> page = adminUserService.getUsers("target", Role.ROLE_MANAGER, "all", "desc", 0, 10);

        assertThat(page).isNotEmpty();
        assertThat(page.getTotalElements()).isEqualTo(1);
    }
}
