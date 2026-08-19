package com.launchly.bot.service.impl;

import com.launchly.auth.entity.User;
import com.launchly.auth.service.UserQueryService;
import com.launchly.bot.dto.request.CreateTemplateRequest;
import com.launchly.bot.dto.response.TemplateResponse;
import com.launchly.bot.entity.AccountTemplate;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.FlowSchema;
import com.launchly.bot.repository.AccountTemplateRepository;
import com.launchly.bot.repository.BotMemberRepository;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.FlowSchemaRepository;
import com.launchly.bot.repository.InstalledTemplateRepository;
import com.launchly.common.exception.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TemplateServiceImplTest {

    @Mock
    private AccountTemplateRepository accountTemplateRepository;

    @Mock
    private InstalledTemplateRepository installedTemplateRepository;

    @Mock
    private BotRepository botRepository;

    @Mock
    private BotMemberRepository botMemberRepository;

    @Mock
    private FlowSchemaRepository flowSchemaRepository;

    @Mock
    private UserQueryService userQueryService;

    @InjectMocks
    private TemplateServiceImpl templateService;

    private User testUser;
    private User otherUser;
    private Bot testBot;

    @BeforeEach
    void setUp() {
        testUser = User.builder().email("user@test.com").name("User").build();
        ReflectionTestUtils.setField(testUser, "id", 1L);

        otherUser = User.builder().email("other@test.com").name("Other").build();
        ReflectionTestUtils.setField(otherUser, "id", 2L);

        testBot = Bot.builder().name("Source Bot").user(testUser).build();
        ReflectionTestUtils.setField(testBot, "id", 10L);
    }

    @Test
    @DisplayName("Should successfully create template from existing bot")
    void createTemplate_WhenValidRequest_Success() {
        CreateTemplateRequest request = new CreateTemplateRequest(
                10L,
                "Onboarding Template",
                "Great template for lead onboarding",
                null,
                false,
                null,
                null,
                null,
                null,
                null,
                null
        );

        when(userQueryService.getUserOrThrow(1L)).thenReturn(testUser);
        when(botRepository.findById(10L)).thenReturn(Optional.of(testBot));

        FlowSchema schema = FlowSchema.builder().bot(testBot).nodes("[]").edges("[]").build();
        when(flowSchemaRepository.findByBotId(10L)).thenReturn(Optional.of(schema));

        AccountTemplate savedTemplate = AccountTemplate.builder()
                .name("Onboarding Template")
                .description("Great template for lead onboarding")
                .shareCode("SHR-12345")
                .creator(testUser)
                .build();
        ReflectionTestUtils.setField(savedTemplate, "id", 100L);

        when(accountTemplateRepository.save(any(AccountTemplate.class))).thenReturn(savedTemplate);
        when(installedTemplateRepository.countByTemplateId(100L)).thenReturn(0L);

        TemplateResponse response = templateService.createTemplate(request, 1L);

        assertThat(response).isNotNull();
        assertThat(response.name()).isEqualTo("Onboarding Template");
        assertThat(response.shareCode()).isEqualTo("SHR-12345");
    }

    @Test
    @DisplayName("Should throw forbidden exception when non-owner tries to export template from another user's bot")
    void createTemplate_WhenUnauthorizedBotAccess_ThrowsForbidden() {
        CreateTemplateRequest request = new CreateTemplateRequest(
                10L,
                "Onboarding Template",
                "Desc",
                null,
                false,
                null,
                null,
                null,
                null,
                null,
                null
        );

        when(userQueryService.getUserOrThrow(2L)).thenReturn(otherUser);
        when(botRepository.findById(10L)).thenReturn(Optional.of(testBot));
        when(botMemberRepository.existsByBotIdAndUserId(10L, 2L)).thenReturn(false);

        assertThatThrownBy(() -> templateService.createTemplate(request, 2L))
                .isInstanceOf(AppException.class);
    }
}
