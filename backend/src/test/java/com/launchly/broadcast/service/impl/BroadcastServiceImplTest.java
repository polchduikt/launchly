package com.launchly.broadcast.service.impl;

import com.launchly.admin.service.UserAuditService;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
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

    @InjectMocks
    private BroadcastServiceImpl broadcastService;

    private Bot testBot;
    private BroadcastCampaign testCampaign;
    private CampaignResponse mockCampaignResponse;

    @BeforeEach
    void setUp() {
        testBot = Bot.builder().name("Broadcast Bot").build();
        ReflectionTestUtils.setField(testBot, "id", 10L);

        testCampaign = BroadcastCampaign.builder()
                .name("Summer Promo")
                .message("50% off promo")
                .status(CampaignStatus.DRAFT)
                .filterType(FilterType.ALL)
                .bot(testBot)
                .build();
        ReflectionTestUtils.setField(testCampaign, "id", 100L);

        mockCampaignResponse = mock(CampaignResponse.class);
    }

    @Test
    @DisplayName("Should successfully create broadcast campaign")
    void createCampaign_WhenValidRequest_Success() {
        CreateCampaignRequest request = new CreateCampaignRequest(
                "Summer Promo",
                "50% off promo",
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
        verify(campaignRepository, times(1)).save(any(BroadcastCampaign.class));
        verify(planLimitService, times(1)).checkBroadcastAccess(1L);
    }

    @Test
    @DisplayName("Should delete campaign when valid bot owner")
    void deleteCampaign_WhenValidOwner_DeletesSuccessfully() {
        when(campaignRepository.findById(100L)).thenReturn(Optional.of(testCampaign));

        broadcastService.deleteCampaign(100L, 1L);

        verify(broadcastValidator, times(1)).validateWriteAccess(10L, 1L);
        verify(campaignRepository, times(1)).delete(testCampaign);
    }
}
