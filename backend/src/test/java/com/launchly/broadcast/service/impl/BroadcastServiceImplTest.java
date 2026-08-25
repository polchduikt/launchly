package com.launchly.broadcast.service.impl;

import com.launchly.admin.service.UserAuditService;
import com.launchly.auth.entity.User;
import com.launchly.billing.service.PlanLimitService;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.repository.BotMemberRepository;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.service.FlowEngineService;
import com.launchly.bot.service.TelegramSendService;
import com.launchly.broadcast.dto.request.CreateCampaignRequest;
import com.launchly.broadcast.dto.response.CampaignResponse;
import com.launchly.broadcast.entity.BroadcastCampaign;
import com.launchly.broadcast.entity.CampaignStatus;
import com.launchly.broadcast.entity.FilterType;
import com.launchly.broadcast.mapper.BroadcastMapper;
import com.launchly.broadcast.repository.BroadcastCampaignRepository;
import com.launchly.broadcast.service.BroadcastFilterService;
import com.launchly.broadcast.validator.BroadcastValidator;
import com.launchly.common.exception.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BroadcastServiceImplTest {

    @Mock
    private BroadcastCampaignRepository campaignRepository;

    @Mock
    private BroadcastFilterService broadcastFilterService;

    @Mock
    private TelegramSendService telegramSendService;

    @Mock
    private BroadcastMapper broadcastMapper;

    @Mock
    private PlanLimitService planLimitService;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private FlowEngineService flowEngineService;

    @Mock
    private UserAuditService userAuditService;

    @Mock
    private BroadcastValidator broadcastValidator;

    @Mock
    private BotRepository botRepository;

    @Mock
    private BotMemberRepository botMemberRepository;

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private BroadcastServiceImpl broadcastService;

    private Bot testBot;
    private User testUser;
    private BroadcastCampaign testCampaign;

    @BeforeEach
    void setUp() {
        lenient().when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        lenient().when(valueOperations.setIfAbsent(anyString(), anyString(), any())).thenReturn(true);
        testUser = User.builder().email("owner@launchly.pro").name("Owner").build();
        ReflectionTestUtils.setField(testUser, "id", 1L);

        testBot = Bot.builder().name("Broadcast Bot").user(testUser).build();
        ReflectionTestUtils.setField(testBot, "id", 10L);

        testCampaign = BroadcastCampaign.builder()
                .name("Summer Promo")
                .message("50% off everything!")
                .bot(testBot)
                .status(CampaignStatus.DRAFT)
                .filterType(FilterType.ALL)
                .nodes("[]")
                .edges("[]")
                .build();
        ReflectionTestUtils.setField(testCampaign, "id", 100L);
    }

    @Test
    @DisplayName("Should successfully create a broadcast campaign with DRAFT status")
    void createCampaign_Draft_Success() {
        CreateCampaignRequest request = new CreateCampaignRequest(
                "Summer Promo",
                "50% off everything!",
                FilterType.ALL,
                null,
                null,
                null,
                null,
                10L,
                false
        );

        when(broadcastValidator.validateBotOwnership(10L, 1L)).thenReturn(testBot);
        when(campaignRepository.save(any(BroadcastCampaign.class))).thenReturn(testCampaign);

        CampaignResponse response = broadcastService.createCampaign(10L, 1L, request);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(100L);
        verify(planLimitService, times(1)).checkBroadcastAccess(1L);
        verify(broadcastValidator, times(1)).validateWriteAccess(10L, 1L);
    }

    @Test
    @DisplayName("Should throw Forbidden when creating campaign without broadcast plan permission")
    void createCampaign_WhenPlanDisallows_ThrowsForbidden() {
        CreateCampaignRequest request = new CreateCampaignRequest(
                "Summer Promo",
                "50% off everything!",
                FilterType.ALL,
                null,
                null,
                null,
                null,
                10L,
                false
        );

        doThrow(new AppException(HttpStatus.FORBIDDEN, "billing.error.feature_not_available"))
                .when(planLimitService).checkBroadcastAccess(1L);

        assertThatThrownBy(() -> broadcastService.createCampaign(10L, 1L, request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Should successfully update an existing campaign")
    void updateCampaign_Success() {
        CreateCampaignRequest request = new CreateCampaignRequest(
                "Updated Promo",
                "70% off!",
                FilterType.ALL,
                null,
                null,
                null,
                null,
                10L,
                false
        );

        when(campaignRepository.findById(100L)).thenReturn(Optional.of(testCampaign));
        when(campaignRepository.save(any(BroadcastCampaign.class))).thenReturn(testCampaign);

        CampaignResponse response = broadcastService.updateCampaign(10L, 100L, 1L, request);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(100L);
        verify(broadcastValidator, times(1)).validateWriteAccess(10L, 1L);
    }

    @Test
    @DisplayName("Should throw Forbidden when updating a blocked campaign")
    void updateCampaign_WhenBlocked_ThrowsForbidden() {
        testCampaign.setStatus(CampaignStatus.BLOCKED);
        testCampaign.setBlocked(true);

        CreateCampaignRequest request = new CreateCampaignRequest(
                "Updated Promo",
                "70% off!",
                FilterType.ALL,
                null,
                null,
                null,
                null,
                10L,
                false
        );

        when(campaignRepository.findById(100L)).thenReturn(Optional.of(testCampaign));

        assertThatThrownBy(() -> broadcastService.updateCampaign(10L, 100L, 1L, request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Should return list of campaigns belonging to bot")
    void getCampaigns_Success() {
        when(campaignRepository.findByBotIdOrderByCreatedAtDesc(10L)).thenReturn(List.of(testCampaign));

        List<CampaignResponse> list = broadcastService.getCampaigns(10L, 1L);

        assertThat(list).hasSize(1);
        verify(broadcastValidator, times(1)).validateBotOwnership(10L, 1L);
    }

    @Test
    @DisplayName("Should launch campaign immediately")
    void sendNow_Success() {
        when(campaignRepository.findById(100L)).thenReturn(Optional.of(testCampaign));

        CampaignResponse response = broadcastService.sendNow(100L, 1L);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(100L);
        verify(userAuditService, times(1)).logBroadcastLaunched(any(), eq(100L), any(), any(), any());
    }

    @Test
    @DisplayName("Should throw BadRequest when sending campaign that is already in progress")
    void sendNow_WhenAlreadyInProgress_ThrowsBadRequest() {
        testCampaign.setStatus(CampaignStatus.IN_PROGRESS);
        when(campaignRepository.findById(100L)).thenReturn(Optional.of(testCampaign));

        assertThatThrownBy(() -> broadcastService.sendNow(100L, 1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Should cancel scheduled campaign and revert to DRAFT")
    void cancelSchedule_Success() {
        testCampaign.setStatus(CampaignStatus.SCHEDULED);
        testCampaign.setScheduledAt(LocalDateTime.now().plusDays(1));

        when(campaignRepository.findById(100L)).thenReturn(Optional.of(testCampaign));
        when(campaignRepository.save(testCampaign)).thenReturn(testCampaign);

        CampaignResponse response = broadcastService.cancelSchedule(100L, 1L);

        assertThat(response).isNotNull();
        assertThat(testCampaign.getStatus()).isEqualTo(CampaignStatus.DRAFT);
        assertThat(testCampaign.getScheduledAt()).isNull();
    }

    @Test
    @DisplayName("Should throw BadRequest when cancelling schedule on non-scheduled campaign")
    void cancelSchedule_WhenNotScheduled_ThrowsBadRequest() {
        testCampaign.setStatus(CampaignStatus.DRAFT);
        when(campaignRepository.findById(100L)).thenReturn(Optional.of(testCampaign));

        assertThatThrownBy(() -> broadcastService.cancelSchedule(100L, 1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Should delete campaign when found")
    void deleteCampaign_Success() {
        when(campaignRepository.findById(100L)).thenReturn(Optional.of(testCampaign));

        broadcastService.deleteCampaign(100L, 1L);

        verify(campaignRepository, times(1)).delete(testCampaign);
    }

    @Test
    @DisplayName("Should throw NotFound when deleting non-existent campaign")
    void deleteCampaign_WhenNotFound_ThrowsNotFound() {
        when(campaignRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> broadcastService.deleteCampaign(999L, 1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.NOT_FOUND);
    }
}
