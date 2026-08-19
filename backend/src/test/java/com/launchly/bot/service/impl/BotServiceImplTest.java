package com.launchly.bot.service.impl;

import com.launchly.admin.service.UserAuditService;
import com.launchly.auth.entity.User;
import com.launchly.auth.service.UserQueryService;
import com.launchly.billing.service.PlanLimitService;
import com.launchly.bot.dto.request.BotCreateRequest;
import com.launchly.bot.dto.response.BotResponse;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.mapper.BotMapper;
import com.launchly.bot.repository.AccountTemplateRepository;
import com.launchly.bot.repository.BotMemberRepository;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.repository.FlowSchemaRepository;
import com.launchly.bot.repository.InstalledTemplateRepository;
import com.launchly.bot.validator.BotAccessValidator;
import com.launchly.common.exception.AppException;
import com.launchly.common.utils.EncryptionUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BotServiceImplTest {

    @Mock
    private BotRepository botRepository;

    @Mock
    private FlowSchemaRepository flowSchemaRepository;

    @Mock
    private BotUserRepository botUserRepository;

    @Mock
    private UserQueryService userQueryService;

    @Mock
    private BotMapper botMapper;

    @Mock
    private EncryptionUtil encryptionUtil;

    @Mock
    private PlanLimitService planLimitService;

    @Mock
    private BotMemberRepository botMemberRepository;

    @Mock
    private InstalledTemplateRepository installedTemplateRepository;

    @Mock
    private AccountTemplateRepository accountTemplateRepository;

    @Mock
    private UserAuditService userAuditService;

    @Mock
    private BotAccessValidator botAccessValidator;

    @InjectMocks
    private BotServiceImpl botService;

    private User testUser;
    private Bot testBot;
    private BotResponse mockBotResponse;

    @BeforeEach
    void setUp() {
        testUser = User.builder().email("user@test.com").name("User").build();
        ReflectionTestUtils.setField(testUser, "id", 1L);

        testBot = Bot.builder()
                .name("Demo Bot")
                .description("Demo bot description")
                .telegramToken("encrypted_dummy")
                .user(testUser)
                .build();
        ReflectionTestUtils.setField(testBot, "id", 10L);

        mockBotResponse = new BotResponse(
                10L, "Demo Bot", "demobot", "Demo bot description", null, null,
                true, false, null, LocalDateTime.now(), LocalDateTime.now(),
                0L, false, "Owner", false, null, 0
        );
    }

    @Test
    @DisplayName("Should successfully create bot with dummy token")
    void createBot_WithDummyToken_Success() {
        BotCreateRequest request = new BotCreateRequest("Demo Bot", "Demo bot description", null, null);

        when(userQueryService.getUserOrThrow(1L)).thenReturn(testUser);
        when(encryptionUtil.encrypt(any())).thenReturn("encrypted_dummy");
        when(botRepository.save(any(Bot.class))).thenReturn(testBot);
        when(botMapper.toBotResponse(any(Bot.class))).thenReturn(mockBotResponse);
        when(encryptionUtil.decrypt("encrypted_dummy")).thenReturn("0000000000:dummyTokenPlaceholderForNoBotConfig");

        BotResponse response = botService.createBot(request, 1L);

        assertThat(response).isNotNull();
        assertThat(response.name()).isEqualTo("Demo Bot");

        verify(flowSchemaRepository, times(1)).save(any());
        verify(userAuditService, times(1)).logBotConnected(eq(testUser), eq(10L), eq("Demo Bot"), any());
    }

    @Test
    @DisplayName("Should return list of bots owned by user")
    void getBotsByUser_WhenBotsExist_ReturnsList() {
        when(botRepository.findAllByUserId(1L)).thenReturn(List.of(testBot));
        when(botMemberRepository.findByUserId(1L)).thenReturn(List.of());
        when(botMapper.toBotResponse(testBot)).thenReturn(mockBotResponse);

        List<BotResponse> bots = botService.getBotsByUser(1L);

        assertThat(bots).hasSize(1);
        assertThat(bots.get(0).name()).isEqualTo("Demo Bot");
    }

    @Test
    @DisplayName("Should delete bot when owned by user")
    void deleteBot_WhenOwner_DeletesSuccessfully() {
        when(botRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBot));

        botService.deleteBot(10L, 1L);

        verify(botAccessValidator, times(1)).validateWriteAccess(testBot, 1L);
        verify(botRepository, times(1)).delete(testBot);
    }

    @Test
    @DisplayName("Should throw not found when bot does not belong to user")
    void deleteBot_WhenNotOwned_ThrowsNotFound() {
        when(botRepository.findByIdAndUserId(10L, 99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> botService.deleteBot(10L, 99L))
                .isInstanceOf(AppException.class);

        verify(botRepository, never()).delete(any());
    }
}
