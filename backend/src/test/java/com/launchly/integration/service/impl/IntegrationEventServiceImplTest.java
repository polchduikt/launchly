package com.launchly.integration.service.impl;

import com.launchly.bot.entity.Bot;
import com.launchly.crm.entity.Order;
import com.launchly.crm.entity.OrderStatus;
import com.launchly.crm.repository.LeadRepository;
import com.launchly.crm.repository.OrderRepository;
import com.launchly.integration.entity.Integration;
import com.launchly.integration.entity.IntegrationType;
import com.launchly.integration.repository.IntegrationRepository;
import com.launchly.integration.service.GoogleSheetsService;
import com.launchly.integration.service.MailchimpService;
import com.launchly.integration.service.WebhookService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IntegrationEventServiceImplTest {

    @Mock
    private IntegrationRepository integrationRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private LeadRepository leadRepository;

    @Mock
    private GoogleSheetsService googleSheetsService;

    @Mock
    private WebhookService webhookService;

    @Mock
    private MailchimpService mailchimpService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private IntegrationEventServiceImpl integrationEventService;

    private Bot testBot;
    private Order testOrder;

    @BeforeEach
    void setUp() {
        testBot = Bot.builder().name("Test Bot").build();
        ReflectionTestUtils.setField(testBot, "id", 10L);

        testOrder = Order.builder()
                .orderNumber("#101")
                .items("Test Item")
                .totalAmount(new BigDecimal("100.00"))
                .currency("UAH")
                .bot(testBot)
                .status(OrderStatus.NEW)
                .build();
        ReflectionTestUtils.setField(testOrder, "id", 1L);
    }

    @Test
    @DisplayName("Should dispatch order event to configured webhooks")
    void onOrderCreated_WithWebhookIntegration_DispatchesWebhook() {
        Integration webhookIntegration = Integration.builder()
                .name("Outgoing Hook")
                .type(IntegrationType.WEBHOOK)
                .bot(testBot)
                .config("{\"url\":\"https://example.com/api\",\"events\":[\"ORDER_CREATED\"]}")
                .active(true)
                .build();
        ReflectionTestUtils.setField(webhookIntegration, "id", 50L);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
        when(integrationRepository.findAllByBotIdAndActiveTrue(10L)).thenReturn(List.of(webhookIntegration));

        integrationEventService.onOrderCreated(testOrder);

        verify(webhookService, times(1)).send(eq("https://example.com/api"), any(), any());
    }
}
