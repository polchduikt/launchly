package com.launchly.crm.service.impl;

import com.cloudinary.Cloudinary;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.service.TelegramSendService;
import com.launchly.bot.telegram.TelegramBotManager;
import com.launchly.common.utils.EncryptionUtil;
import com.launchly.crm.dto.response.OrderResponse;
import com.launchly.crm.entity.Order;
import com.launchly.crm.entity.OrderStatus;
import com.launchly.crm.mapper.CrmMapper;
import com.launchly.crm.repository.ConversationRepository;
import com.launchly.crm.repository.CrmLabelRepository;
import com.launchly.crm.repository.LeadRepository;
import com.launchly.crm.repository.MessageRepository;
import com.launchly.crm.repository.OrderRepository;
import com.launchly.crm.websocket.CrmWebSocketService;
import com.launchly.integration.service.IntegrationEventService;
import com.launchly.notification.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CrmServiceImplTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private LeadRepository leadRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private BotRepository botRepository;

    @Mock
    private BotUserRepository botUserRepository;

    @Mock
    private CrmMapper crmMapper;

    @Mock
    private CrmWebSocketService webSocketService;

    @Mock
    private TelegramSendService telegramSendService;

    @Mock
    private IntegrationEventService integrationEventService;

    @Mock
    private TelegramBotManager botManager;

    @Mock
    private EncryptionUtil encryptionUtil;

    @Mock
    private Cloudinary cloudinary;

    @Mock
    private NotificationService notificationService;

    @Mock
    private CrmLabelRepository crmLabelRepository;

    @Mock
    private com.launchly.auth.repository.UserRepository userRepository;

    @InjectMocks
    private CrmServiceImpl crmService;

    private Bot testBot;
    private BotUser testBotUser;
    private Order testOrder;
    private OrderResponse mockOrderResponse;

    @BeforeEach
    void setUp() {
        testBot = Bot.builder().name("Shop Bot").orderSequence(10L).build();
        ReflectionTestUtils.setField(testBot, "id", 1L);

        testBotUser = BotUser.builder().bot(testBot).telegramId(12345L).build();
        ReflectionTestUtils.setField(testBotUser, "id", 100L);

        testOrder = Order.builder()
                .orderNumber("#11")
                .items("Coffee x2")
                .totalAmount(new BigDecimal("150.00"))
                .currency("UAH")
                .bot(testBot)
                .botUser(testBotUser)
                .status(OrderStatus.NEW)
                .build();
        ReflectionTestUtils.setField(testOrder, "id", 1000L);

        mockOrderResponse = mock(OrderResponse.class);
    }

    @Test
    @DisplayName("Should successfully create order and notify via WebSocket and Integrations")
    void createOrder_Success() {
        when(botRepository.findById(1L)).thenReturn(Optional.of(testBot));
        when(botUserRepository.findById(100L)).thenReturn(Optional.of(testBotUser));
        when(orderRepository.save(any(Order.class))).thenReturn(testOrder);
        when(crmMapper.toOrderResponse(any(Order.class))).thenReturn(mockOrderResponse);

        OrderResponse response = crmService.createOrder(1L, 100L, "Coffee x2", new BigDecimal("150.00"), "UAH");

        assertThat(response).isNotNull();

        verify(orderRepository, times(1)).save(any(Order.class));
        verify(webSocketService, times(1)).notifyNewOrder(eq(1L), any(OrderResponse.class));
        verify(integrationEventService, times(1)).onOrderCreated(any(Order.class));
    }
}
