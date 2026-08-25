package com.launchly.crm.service.impl;

import com.launchly.auth.entity.User;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.common.exception.AppException;
import com.launchly.crm.dto.request.LeadUpdateRequest;
import com.launchly.crm.dto.request.OrderUpdateRequest;
import com.launchly.crm.dto.response.LeadResponse;
import com.launchly.crm.dto.response.MessageResponse;
import com.launchly.crm.dto.response.OrderResponse;
import com.launchly.crm.entity.*;
import com.launchly.crm.mapper.CrmMapper;
import com.launchly.crm.repository.ConversationRepository;
import com.launchly.crm.repository.LeadRepository;
import com.launchly.crm.repository.MessageRepository;
import com.launchly.crm.repository.OrderRepository;
import com.launchly.crm.websocket.CrmWebSocketService;
import com.launchly.integration.service.IntegrationEventService;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
    private IntegrationEventService integrationEventService;

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private CrmServiceImpl crmService;

    private User testUser;
    private Bot testBot;
    private BotUser testBotUser;
    private Order testOrder;
    private Lead testLead;

    @BeforeEach
    void setUp() {
        lenient().when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        lenient().when(valueOperations.setIfAbsent(anyString(), anyString(), any())).thenReturn(true);
        testUser = User.builder().email("crm@launchly.pro").name("CRM User").build();
        ReflectionTestUtils.setField(testUser, "id", 1L);

        testBot = Bot.builder().name("Shop Bot").orderSequence(10L).user(testUser).build();
        ReflectionTestUtils.setField(testBot, "id", 1L);

        testBotUser = BotUser.builder().telegramId(123456L).bot(testBot).build();
        ReflectionTestUtils.setField(testBotUser, "id", 100L);

        testOrder = Order.builder()
                .orderNumber("#11")
                .items("Coffee Pack")
                .totalAmount(new BigDecimal("250.00"))
                .currency("UAH")
                .bot(testBot)
                .botUser(testBotUser)
                .status(OrderStatus.NEW)
                .build();
        ReflectionTestUtils.setField(testOrder, "id", 50L);

        testLead = Lead.builder()
                .name("Alex Lead")
                .email("alex@example.com")
                .phone("+380991112233")
                .bot(testBot)
                .botUser(testBotUser)
                .status(LeadStatus.NEW)
                .build();
        ReflectionTestUtils.setField(testLead, "id", 80L);
    }

    @Test
    @DisplayName("Should successfully create order, increment sequence and notify WebSocket")
    void createOrder_Success() {
        when(botRepository.findById(1L)).thenReturn(Optional.of(testBot));
        when(botUserRepository.findById(100L)).thenReturn(Optional.of(testBotUser));
        when(orderRepository.save(any(Order.class))).thenReturn(testOrder);

        OrderResponse mockOrderResponse = mock(OrderResponse.class);
        when(crmMapper.toOrderResponse(any(Order.class))).thenReturn(mockOrderResponse);

        OrderResponse result = crmService.createOrder(1L, 100L, "Coffee Pack", new BigDecimal("250.00"), "UAH");

        assertThat(result).isNotNull();
        assertThat(testBot.getOrderSequence()).isEqualTo(11L);
        verify(orderRepository, times(1)).save(any(Order.class));
        verify(webSocketService, times(1)).notifyNewOrder(eq(1L), any());
    }

    @Test
    @DisplayName("Should return orders by bot when user is owner")
    void getOrdersByBot_Success() {
        when(botRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(testBot));
        when(orderRepository.findByBotIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(testOrder));
        when(crmMapper.toOrderResponseList(List.of(testOrder))).thenReturn(List.of(mock(OrderResponse.class)));

        List<OrderResponse> orders = crmService.getOrdersByBot(1L, 1L);

        assertThat(orders).hasSize(1);
    }

    @Test
    @DisplayName("Should throw Forbidden when getting orders without bot ownership")
    void getOrdersByBot_WhenAccessDenied_ThrowsForbidden() {
        when(botRepository.findByIdAndUserId(1L, 999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> crmService.getOrdersByBot(1L, 999L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Should update order status")
    void updateOrder_Success() {
        OrderUpdateRequest request = new OrderUpdateRequest(OrderStatus.COMPLETED, "Delivery to Kyiv");
        when(orderRepository.findById(50L)).thenReturn(Optional.of(testOrder));
        when(botRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(testBot));
        when(orderRepository.save(testOrder)).thenReturn(testOrder);
        when(crmMapper.toOrderResponse(testOrder)).thenReturn(mock(OrderResponse.class));

        OrderResponse response = crmService.updateOrder(50L, request, 1L);

        assertThat(response).isNotNull();
        assertThat(testOrder.getStatus()).isEqualTo(OrderStatus.COMPLETED);
        assertThat(testOrder.getNotes()).isEqualTo("Delivery to Kyiv");
    }

    @Test
    @DisplayName("Should throw NotFound when updating non-existent order")
    void updateOrder_WhenNotFound_ThrowsNotFound() {
        OrderUpdateRequest request = new OrderUpdateRequest(OrderStatus.COMPLETED, null);
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> crmService.updateOrder(999L, request, 1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("Should successfully create lead")
    void createLead_Success() {
        when(botRepository.findById(1L)).thenReturn(Optional.of(testBot));
        when(botUserRepository.findById(100L)).thenReturn(Optional.of(testBotUser));
        when(leadRepository.save(any(Lead.class))).thenReturn(testLead);
        when(crmMapper.toLeadResponse(any(Lead.class))).thenReturn(mock(LeadResponse.class));

        LeadResponse response = crmService.createLead(1L, 100L, "Alex Lead", "alex@example.com", "+380991112233", "{}");

        assertThat(response).isNotNull();
        verify(leadRepository, times(1)).save(any(Lead.class));
        verify(webSocketService, times(1)).notifyNewLead(eq(1L), any());
    }

    @Test
    @DisplayName("Should return leads by bot")
    void getLeadsByBot_Success() {
        when(botRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(testBot));
        when(leadRepository.findByBotIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(testLead));
        when(crmMapper.toLeadResponseList(List.of(testLead))).thenReturn(List.of(mock(LeadResponse.class)));

        List<LeadResponse> leads = crmService.getLeadsByBot(1L, 1L);

        assertThat(leads).hasSize(1);
    }

    @Test
    @DisplayName("Should update lead details")
    void updateLead_Success() {
        LeadUpdateRequest request = new LeadUpdateRequest(LeadStatus.QUALIFIED, "Interested in Pro plan");
        when(leadRepository.findById(80L)).thenReturn(Optional.of(testLead));
        when(botRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(testBot));
        when(leadRepository.save(testLead)).thenReturn(testLead);
        when(crmMapper.toLeadResponse(testLead)).thenReturn(mock(LeadResponse.class));

        LeadResponse response = crmService.updateLead(80L, request, 1L);

        assertThat(response).isNotNull();
        assertThat(testLead.getStatus()).isEqualTo(LeadStatus.QUALIFIED);
        assertThat(testLead.getNotes()).isEqualTo("Interested in Pro plan");
    }

    @Test
    @DisplayName("Should throw NotFound when updating non-existent lead")
    void updateLead_WhenNotFound_ThrowsNotFound() {
        LeadUpdateRequest request = new LeadUpdateRequest(LeadStatus.QUALIFIED, null);
        when(leadRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> crmService.updateLead(999L, request, 1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("Should throw NotFound when getting messages for non-existent conversation")
    void getMessages_WhenNotFound_ThrowsNotFound() {
        when(conversationRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> crmService.getMessages(999L, 1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.NOT_FOUND);
    }
}
