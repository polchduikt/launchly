package com.launchly.integration.service.impl;

import tools.jackson.databind.ObjectMapper;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.common.exception.AppException;
import com.launchly.crm.entity.Lead;
import com.launchly.crm.entity.Order;
import com.launchly.crm.repository.LeadRepository;
import com.launchly.crm.repository.OrderRepository;
import com.launchly.integration.entity.Integration;
import com.launchly.integration.entity.IntegrationType;
import com.launchly.integration.repository.IntegrationRepository;
import com.launchly.integration.service.IntegrationEventService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HotmartServiceImplTest {

    @Mock
    private IntegrationRepository integrationRepository;

    @Mock
    private BotRepository botRepository;

    @Mock
    private BotUserRepository botUserRepository;

    @Mock
    private LeadRepository leadRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private IntegrationEventService integrationEventService;

    private ObjectMapper objectMapper;

    private HotmartServiceImpl hotmartService;

    private Bot testBot;
    private Integration testIntegration;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        hotmartService = new HotmartServiceImpl(
                integrationRepository,
                botRepository,
                botUserRepository,
                leadRepository,
                orderRepository,
                integrationEventService,
                objectMapper
        );

        testBot = Bot.builder().name("TestBot").orderSequence(10L).build();
        testBot.setId(1L);

        testIntegration = Integration.builder()
                .bot(testBot)
                .type(IntegrationType.HOTMART)
                .active(true)
                .config("{\"hottok\":\"secret_hotmart_token\"}")
                .build();
        testIntegration.setId(100L);
    }

    @Test
    @DisplayName("Should throw BAD_REQUEST when rawPayload is missing or empty")
    void processWebhook_MissingPayload_ThrowsBadRequest() {
        assertThatThrownBy(() -> hotmartService.processWebhook(1L, "token", ""))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    @DisplayName("Should throw NOT_FOUND when bot does not exist")
    void processWebhook_BotNotFound_ThrowsNotFound() {
        when(botRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> hotmartService.processWebhook(99L, "token", "{}"))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    @DisplayName("Should throw UNAUTHORIZED when token mismatch occurs")
    void processWebhook_InvalidToken_ThrowsUnauthorized() {
        when(botRepository.findById(1L)).thenReturn(Optional.of(testBot));
        when(integrationRepository.findByBotIdAndType(1L, IntegrationType.HOTMART)).thenReturn(Optional.of(testIntegration));

        String payload = "{\"hottok\":\"wrong_token\",\"event\":\"PURCHASE_COMPLETE\"}";

        assertThatThrownBy(() -> hotmartService.processWebhook(1L, "wrong_token", payload))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    @DisplayName("Should successfully process webhook with valid token and constant-time match")
    void processWebhook_ValidToken_Success() {
        when(botRepository.findById(1L)).thenReturn(Optional.of(testBot));
        when(integrationRepository.findByBotIdAndType(1L, IntegrationType.HOTMART)).thenReturn(Optional.of(testIntegration));

        BotUser botUser = BotUser.builder().bot(testBot).telegramId(12345L).build();
        botUser.setId(50L);
        when(botUserRepository.findByTelegramIdAndBotId(any(), eq(1L))).thenReturn(Optional.of(botUser));

        Lead lead = Lead.builder().bot(testBot).botUser(botUser).build();
        lead.setId(200L);
        when(leadRepository.save(any(Lead.class))).thenReturn(lead);

        Order order = Order.builder().bot(testBot).botUser(botUser).orderNumber("#11").build();
        order.setId(300L);
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        String payload = """
                {
                    "event": "PURCHASE_COMPLETE",
                    "hottok": "secret_hotmart_token",
                    "data": {
                        "buyer": {
                            "name": "Jane Doe",
                            "email": "jane@example.com"
                        },
                        "product": {
                            "name": "Course Pro"
                        },
                        "purchase": {
                            "status": "APPROVED",
                            "price": { "value": 99.0 },
                            "transaction": "TX-1001"
                        }
                    }
                }
                """;

        hotmartService.processWebhook(1L, "secret_hotmart_token", payload);

        verify(leadRepository).save(any(Lead.class));
        verify(orderRepository).save(any(Order.class));
        verify(integrationEventService).onLeadCreated(lead);
        verify(integrationEventService).onOrderCreated(order);
    }
}
