package com.launchly.admin.service.impl;

import com.launchly.admin.dto.AdminBroadcastDto;
import com.launchly.admin.mapper.AdminMapper;
import com.launchly.admin.repository.UserAuditLogRepository;
import com.launchly.admin.service.UserAuditService;
import com.launchly.admin.util.AdminPeriodResolver;
import com.launchly.broadcast.entity.BroadcastCampaign;
import com.launchly.broadcast.entity.CampaignStatus;
import com.launchly.broadcast.entity.FilterType;
import com.launchly.broadcast.repository.BroadcastCampaignRepository;
import com.launchly.common.utils.MessageUtils;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminBroadcastServiceImplTest {

    @Mock
    private BroadcastCampaignRepository broadcastCampaignRepository;

    @Mock
    private UserAuditLogRepository userAuditLogRepository;

    @Mock
    private UserAuditService userAuditService;

    @Mock
    private AdminPeriodResolver periodResolver;

    @Mock
    private AdminMapper adminMapper;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private AdminBroadcastServiceImpl adminBroadcastService;

    private BroadcastCampaign testCampaign;
    private AdminBroadcastDto mockDto;

    @BeforeEach
    void setUp() {
        testCampaign = BroadcastCampaign.builder()
                .name("Global Update")
                .message("Hello")
                .status(CampaignStatus.DRAFT)
                .filterType(FilterType.ALL)
                .build();
        ReflectionTestUtils.setField(testCampaign, "id", 100L);

        mockDto = mock(AdminBroadcastDto.class);
    }

    @Test
    @DisplayName("Should return paginated broadcasts for admin backoffice")
    void getBroadcasts_ReturnsPage() {
        Page<BroadcastCampaign> campaignPage = new PageImpl<>(List.of(testCampaign));

        when(broadcastCampaignRepository.findAdminBroadcasts(eq(""), eq("all"), any(Pageable.class)))
                .thenReturn(campaignPage);
        when(adminMapper.toBroadcastDto(eq(testCampaign), any(), any()))
                .thenReturn(mockDto);

        Page<AdminBroadcastDto> result = adminBroadcastService.getBroadcasts(null, null, "desc", 0, 10);

        assertThat(result).isNotEmpty();
        assertThat(result.getTotalElements()).isEqualTo(1);
    }
}
