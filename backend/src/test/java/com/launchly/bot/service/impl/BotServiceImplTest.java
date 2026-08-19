package com.launchly.bot.service.impl;

import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import com.launchly.auth.service.UserQueryService;
import com.launchly.billing.service.PlanLimitService;
import com.launchly.bot.dto.request.BotCreateRequest;
import com.launchly.bot.dto.request.BotUpdateRequest;
import com.launchly.bot.dto.response.BotDetailResponse;
import com.launchly.bot.dto.response.BotResponse;
import com.launchly.bot.dto.response.FlowSchemaResponse;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.FlowSchema;
import com.launchly.bot.mapper.BotMapper;
import com.launchly.bot.repository.*;
import com.launchly.bot.telegram.TelegramBotManager;
import com.launchly.bot.validator.BotAccessValidator;
import com.launchly.bot.validator.FlowSchemaValidator;
import com.launchly.common.exception.AppException;
import com.launchly.common.utils.EncryptionUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.ObjectMapper;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
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
    private TelegramBotManager telegramBotManager;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private PlanLimitService planLimitService;

    @Mock
    private BotMemberRepository botMemberRepository;

    @Mock
    private InstalledTemplateRepository installedTemplateRepository;

    @Mock
    private AccountTemplateRepository accountTemplateRepository;

    @Mock
    private com.launchly.admin.service.UserAuditService userAuditService;

    @Mock
    private FlowSchemaValidator flowSchemaValidator;

    @Mock
    private BotAccessValidator botAccessValidator;

    @InjectMocks
    private BotServiceImpl botService;

    private User testUser;
    private Bot testBot;
    private BotResponse mockBotResponse;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .email("user@launchly.pro")
                .name("Bot Creator")
                .role(Role.ROLE_OWNER)
                .build();
        ReflectionTestUtils.setField(testUser, "id", 1L);

        testBot = Bot.builder()
                .name("Support Assistant")
                .description("Customer helper")
                .telegramToken("encrypted_token_123")
                .user(testUser)
                .active(false)
                .build();
        ReflectionTestUtils.setField(testBot, "id", 10L);

        mockBotResponse = mock(BotResponse.class);
    }

    @Test
    @DisplayName("Should create bot with placeholder token")
    void createBot_WithDummyToken_Success() {
        BotCreateRequest request = new BotCreateRequest("New Bot", "Description", null, null);

        when(userQueryService.getUserOrThrow(1L)).thenReturn(testUser);
        when(encryptionUtil.encrypt("0000000000:dummyTokenPlaceholderForNoBotConfig")).thenReturn("encrypted_dummy");
        when(botRepository.save(any(Bot.class))).thenReturn(testBot);
        when(botMapper.toBotResponse(any(Bot.class))).thenReturn(mockBotResponse);

        BotResponse response = botService.createBot(request, 1L);

        assertThat(response).isNotNull();
        verify(flowSchemaRepository, times(1)).save(any(FlowSchema.class));
    }

    @Test
    @DisplayName("Should enforce plan bot limit when creating bot with real token")
    void createBot_WhenLimitReached_ThrowsPaymentRequired() {
        BotCreateRequest request = new BotCreateRequest("Real Bot", "Description", "123456:realToken", null);

        when(userQueryService.getUserOrThrow(1L)).thenReturn(testUser);
        doThrow(new AppException(HttpStatus.PAYMENT_REQUIRED, "billing.error.bot_limit_reached"))
                .when(planLimitService).checkBotLimit(1L, "123456:realToken");

        assertThatThrownBy(() -> botService.createBot(request, 1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.PAYMENT_REQUIRED);
    }

    @Test
    @DisplayName("Should return all bots owned or shared with the user")
    void getBotsByUser_Success() {
        when(botRepository.findAllByUserId(1L)).thenReturn(List.of(testBot));
        when(botMemberRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
        when(botMapper.toBotResponse(any(Bot.class))).thenReturn(mockBotResponse);

        List<BotResponse> bots = botService.getBotsByUser(1L);

        assertThat(bots).hasSize(1);
    }

    @Test
    @DisplayName("Should return bot details when bot is found and user has access")
    void getBotById_Success() {
        when(botRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBot));
        when(flowSchemaRepository.findByBotId(10L)).thenReturn(Optional.empty());
        when(encryptionUtil.decrypt("encrypted_token_123")).thenReturn("raw_token_xyz");

        BotDetailResponse response = botService.getBotById(10L, 1L);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(10L);
        assertThat(response.name()).isEqualTo("Support Assistant");
    }

    @Test
    @DisplayName("Should throw NotFound when accessing non-existent bot")
    void getBotById_WhenNotFound_ThrowsNotFound() {
        when(botRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> botService.getBotById(99L, 1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("Should successfully update bot details")
    void updateBot_Success() {
        BotUpdateRequest request = new BotUpdateRequest("Renamed Bot", "Updated description", null, null, null, null);
        when(botRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBot));
        when(botRepository.save(any(Bot.class))).thenReturn(testBot);
        when(botMapper.toBotResponse(any(Bot.class))).thenReturn(mockBotResponse);

        BotResponse response = botService.updateBot(10L, request, 1L);

        assertThat(response).isNotNull();
        verify(botAccessValidator, times(1)).validateWriteAccess(testBot, 1L);
    }

    @Test
    @DisplayName("Should throw Forbidden when updating bot without write permissions")
    void updateBot_WhenAccessDenied_ThrowsForbidden() {
        BotUpdateRequest request = new BotUpdateRequest("Renamed Bot", "Updated description", null, null, null, null);
        when(botRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBot));
        doThrow(new AppException(HttpStatus.FORBIDDEN, "common.error.access_denied"))
                .when(botAccessValidator).validateWriteAccess(testBot, 1L);

        assertThatThrownBy(() -> botService.updateBot(10L, request, 1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Should delete bot when user has ownership/write access")
    void deleteBot_Success() {
        when(botRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBot));

        botService.deleteBot(10L, 1L);

        verify(botRepository, times(1)).delete(testBot);
    }

    @Test
    @DisplayName("Should throw Forbidden when deleting bot without proper access")
    void deleteBot_WhenUnauthorized_ThrowsForbidden() {
        when(botRepository.findByIdAndUserId(10L, 2L)).thenReturn(Optional.of(testBot));
        doThrow(new AppException(HttpStatus.FORBIDDEN, "common.error.access_denied"))
                .when(botAccessValidator).validateWriteAccess(testBot, 2L);

        assertThatThrownBy(() -> botService.deleteBot(10L, 2L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Should start inactive bot with real token")
    void startBot_Success() {
        when(botRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBot));
        when(encryptionUtil.decrypt("encrypted_token_123")).thenReturn("123456:validToken");
        when(botRepository.findAllByActiveTrue()).thenReturn(Collections.emptyList());
        when(botRepository.save(any(Bot.class))).thenReturn(testBot);
        when(botMapper.toBotResponse(any(Bot.class))).thenReturn(mockBotResponse);

        BotResponse response = botService.startBot(10L, 1L);

        assertThat(response).isNotNull();
        verify(telegramBotManager, times(1)).registerBot(testBot);
    }

    @Test
    @DisplayName("Should throw Conflict when starting already running bot")
    void startBot_WhenAlreadyRunning_ThrowsConflict() {
        testBot.setActive(true);
        when(botRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBot));

        assertThatThrownBy(() -> botService.startBot(10L, 1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("Should throw BadRequest when starting bot with dummy token")
    void startBot_WhenDummyToken_ThrowsBadRequest() {
        when(botRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBot));
        when(encryptionUtil.decrypt("encrypted_token_123"))
                .thenReturn("0000000000:dummyTokenPlaceholderForNoBotConfig");

        assertThatThrownBy(() -> botService.startBot(10L, 1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Should stop active bot")
    void stopBot_Success() {
        testBot.setActive(true);
        when(botRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBot));
        when(botRepository.save(any(Bot.class))).thenReturn(testBot);
        when(botMapper.toBotResponse(any(Bot.class))).thenReturn(mockBotResponse);

        BotResponse response = botService.stopBot(10L, 1L);

        assertThat(response).isNotNull();
        verify(telegramBotManager, times(1)).unregisterBot(10L);
    }

    @Test
    @DisplayName("Should throw Conflict when stopping already inactive bot")
    void stopBot_WhenAlreadyStopped_ThrowsConflict() {
        testBot.setActive(false);
        when(botRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBot));

        assertThatThrownBy(() -> botService.stopBot(10L, 1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("Should retrieve flow schema for bot")
    void getFlowSchema_Success() {
        FlowSchema schema = FlowSchema.builder().bot(testBot).nodes("[]").edges("[]").build();
        when(botRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBot));
        when(flowSchemaRepository.findByBotId(10L)).thenReturn(Optional.of(schema));

        FlowSchemaResponse response = botService.getFlowSchema(10L, 1L);

        assertThat(response).isNotNull();
    }
}
