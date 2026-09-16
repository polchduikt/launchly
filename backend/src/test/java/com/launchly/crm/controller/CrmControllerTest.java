package com.launchly.crm.controller;

import com.launchly.common.exception.GlobalExceptionHandler;
import com.launchly.common.security.CustomUserDetails;
import com.launchly.common.utils.MessageUtils;
import com.launchly.crm.dto.request.AddNoteRequest;
import com.launchly.crm.dto.request.ConversationUpdateRequest;
import com.launchly.crm.dto.request.LeadUpdateRequest;
import com.launchly.crm.dto.request.OrderUpdateRequest;
import com.launchly.crm.dto.request.SendMessageRequest;
import com.launchly.crm.dto.response.ConversationResponse;
import com.launchly.crm.dto.response.LeadResponse;
import com.launchly.crm.dto.response.MessageResponse;
import com.launchly.crm.dto.response.OrderResponse;
import com.launchly.crm.entity.LeadStatus;
import com.launchly.crm.entity.OrderStatus;
import com.launchly.crm.service.CrmService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class CrmControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private CrmService crmService;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private CrmController crmController;

    private CustomUserDetails mockUserDetails;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockUserDetails = mock(CustomUserDetails.class);
        lenient().when(mockUserDetails.getId()).thenReturn(1L);

        HandlerMethodArgumentResolver authResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class)
                        || CustomUserDetails.class.isAssignableFrom(parameter.getParameterType());
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return mockUserDetails;
            }
        };

        GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler(messageUtils);
        mockMvc = MockMvcBuilders.standaloneSetup(crmController)
                .setCustomArgumentResolvers(authResolver)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/crm/labels - Should return CRM labels")
    void getLabels_Success() throws Exception {
        when(crmService.getLabels(1L)).thenReturn(List.of("VIP", "URGENT"));

        mockMvc.perform(get("/api/v1/crm/labels"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value("VIP"));
    }

    @Test
    @DisplayName("POST /api/v1/crm/labels - Should add label and return list")
    void addLabel_Success() throws Exception {
        when(crmService.addLabel("NEW", 1L)).thenReturn(List.of("VIP", "NEW"));

        mockMvc.perform(post("/api/v1/crm/labels")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "NEW"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$[1]").value("NEW"));
    }

    @Test
    @DisplayName("GET /api/v1/crm/bots/{botId}/orders - Should return orders list")
    void getOrders_Success() throws Exception {
        OrderResponse order = mock(OrderResponse.class);
        when(crmService.getOrdersByBot(10L, 1L)).thenReturn(List.of(order));

        mockMvc.perform(get("/api/v1/crm/bots/10/orders"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PATCH /api/v1/crm/orders/{orderId} - Should update order")
    void updateOrder_Success() throws Exception {
        OrderUpdateRequest request = new OrderUpdateRequest(OrderStatus.COMPLETED, "Payment verified");
        OrderResponse response = mock(OrderResponse.class);
        when(crmService.updateOrder(eq(5L), any(OrderUpdateRequest.class), eq(1L))).thenReturn(response);

        mockMvc.perform(patch("/api/v1/crm/orders/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/v1/crm/bots/{botId}/leads - Should return leads list")
    void getLeads_Success() throws Exception {
        LeadResponse lead = mock(LeadResponse.class);
        when(crmService.getLeadsByBot(10L, 1L)).thenReturn(List.of(lead));

        mockMvc.perform(get("/api/v1/crm/bots/10/leads"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PATCH /api/v1/crm/leads/{leadId} - Should update lead")
    void updateLead_Success() throws Exception {
        LeadUpdateRequest request = new LeadUpdateRequest(LeadStatus.QUALIFIED, "Interested in PRO tier");
        LeadResponse response = mock(LeadResponse.class);
        when(crmService.updateLead(eq(8L), any(LeadUpdateRequest.class), eq(1L))).thenReturn(response);

        mockMvc.perform(patch("/api/v1/crm/leads/8")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/v1/crm/conversations - Should return all conversations")
    void getAllConversations_Success() throws Exception {
        ConversationResponse conversation = mock(ConversationResponse.class);
        when(crmService.getAllConversations(1L)).thenReturn(List.of(conversation));

        mockMvc.perform(get("/api/v1/crm/conversations"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/v1/crm/conversations/{id}/messages - Should return conversation messages")
    void getMessages_Success() throws Exception {
        MessageResponse message = mock(MessageResponse.class);
        when(crmService.getMessages(12L, 1L)).thenReturn(List.of(message));

        mockMvc.perform(get("/api/v1/crm/conversations/12/messages"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/v1/crm/conversations/{id}/messages - Should send message")
    void sendMessage_Success() throws Exception {
        SendMessageRequest request = new SendMessageRequest("Hello from agent", null, null, null);
        MessageResponse response = mock(MessageResponse.class);
        when(crmService.sendOwnerMessage(eq(12L), any(SendMessageRequest.class), eq(1L))).thenReturn(response);

        mockMvc.perform(post("/api/v1/crm/conversations/12/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/v1/crm/conversations/{id}/notes - Should add internal note")
    void addNote_Success() throws Exception {
        AddNoteRequest request = new AddNoteRequest("Customer requested refund");
        MessageResponse response = mock(MessageResponse.class);
        when(crmService.addNote(eq(12L), any(AddNoteRequest.class), eq(1L))).thenReturn(response);

        mockMvc.perform(post("/api/v1/crm/conversations/12/notes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }
}
