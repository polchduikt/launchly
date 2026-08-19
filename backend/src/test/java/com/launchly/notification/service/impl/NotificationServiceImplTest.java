package com.launchly.notification.service.impl;

import com.launchly.auth.dto.response.UserResponse;
import com.launchly.auth.entity.User;
import com.launchly.auth.mapper.AuthMapper;
import com.launchly.auth.service.UserQueryService;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.telegram.TelegramBotManager;
import com.launchly.crm.repository.ConversationRepository;
import com.launchly.notification.dto.UpdateNotificationSettingsRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private ObjectProvider<JavaMailSender> mailSenderProvider;

    @Mock
    private ObjectProvider<TelegramBotManager> botManagerProvider;

    @Mock
    private UserQueryService userQueryService;

    @Mock
    private BotUserRepository botUserRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private AuthMapper authMapper;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private User testUser;
    private UserResponse mockResponse;

    @BeforeEach
    void setUp() {
        testUser = User.builder().email("user@test.com").name("User").build();
        ReflectionTestUtils.setField(testUser, "id", 1L);

        mockResponse = mock(UserResponse.class);
    }

    @Test
    @DisplayName("Should successfully update user notification settings")
    void updateSettings_Success() {
        UpdateNotificationSettingsRequest request = new UpdateNotificationSettingsRequest(
                true,
                false,
                "alerts@test.com",
                true,
                "MONDAY",
                9,
                7,
                true,
                false
        );

        when(userQueryService.getUserByEmailOrThrow("user@test.com")).thenReturn(testUser);
        when(userQueryService.save(any(User.class))).thenReturn(testUser);
        when(authMapper.toUserResponse(testUser)).thenReturn(mockResponse);

        UserResponse response = notificationService.updateSettings("user@test.com", request);

        assertThat(response).isNotNull();
        assertThat(testUser.isNotifyEmail()).isTrue();
        assertThat(testUser.getNotificationEmail()).isEqualTo("alerts@test.com");
    }
}
