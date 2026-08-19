package com.launchly.crm;

import com.launchly.BaseIntegrationTest;
import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.crm.dto.request.LeadUpdateRequest;
import com.launchly.crm.dto.request.OrderUpdateRequest;
import com.launchly.crm.entity.Conversation;
import com.launchly.crm.entity.ConversationStatus;
import com.launchly.crm.entity.Lead;
import com.launchly.crm.entity.LeadStatus;
import com.launchly.crm.entity.Order;
import com.launchly.crm.entity.OrderStatus;
import com.launchly.crm.repository.ConversationRepository;
import com.launchly.crm.repository.LeadRepository;
import com.launchly.crm.repository.OrderRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CrmIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private BotUserRepository botUserRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Test
    @DisplayName("Should add, retrieve, and delete CRM labels")
    void crmLabels_Lifecycle_Success() throws Exception {
        User user = createTestUser("crmlabels", Role.ROLE_OWNER);

        mockMvc.perform(post("/api/v1/crm/labels")
                        .header("Authorization", getAuthHeader(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "Priority Lead"))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/crm/labels")
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value("Priority Lead"));

        mockMvc.perform(delete("/api/v1/crm/labels/Priority Lead")
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should retrieve bot conversations and unified inbox")
    void getConversations_Success() throws Exception {
        User user = createTestUser("inboxuser", Role.ROLE_OWNER);
        Bot bot = createTestBot(user, "Inbox Bot");

        BotUser botUser = BotUser.builder()
                .bot(bot)
                .telegramId(123456789L)
                .username("testclient")
                .firstName("John")
                .build();
        botUser = botUserRepository.save(botUser);

        Conversation conv = Conversation.builder()
                .bot(bot)
                .botUser(botUser)
                .status(ConversationStatus.OPEN)
                .build();
        conversationRepository.save(conv);

        mockMvc.perform(get("/api/v1/crm/bots/" + bot.getId() + "/conversations")
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].botId").value(bot.getId()));

        mockMvc.perform(get("/api/v1/crm/conversations")
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("Should retrieve leads and update lead pipeline status in DB")
    void leads_GetAndUpdate_Success() throws Exception {
        User user = createTestUser("leaduser", Role.ROLE_OWNER);
        Bot bot = createTestBot(user, "Lead Bot");

        BotUser botUser = BotUser.builder()
                .bot(bot)
                .telegramId(987654321L)
                .firstName("Alice")
                .build();
        botUser = botUserRepository.save(botUser);

        Lead lead = Lead.builder()
                .bot(bot)
                .botUser(botUser)
                .status(LeadStatus.NEW)
                .name("Alice")
                .phone("+1234567890")
                .build();
        lead = leadRepository.save(lead);

        mockMvc.perform(get("/api/v1/crm/bots/" + bot.getId() + "/leads")
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Alice"));

        LeadUpdateRequest updateRequest = new LeadUpdateRequest(LeadStatus.QUALIFIED, "Interested in Pro plan");

        mockMvc.perform(patch("/api/v1/crm/leads/" + lead.getId())
                        .header("Authorization", getAuthHeader(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("QUALIFIED"));

        Lead updated = leadRepository.findById(lead.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(LeadStatus.QUALIFIED);
        assertThat(updated.getNotes()).isEqualTo("Interested in Pro plan");
    }

    @Test
    @DisplayName("Should retrieve orders and update order status in DB")
    void orders_GetAndUpdate_Success() throws Exception {
        User user = createTestUser("orderuser", Role.ROLE_OWNER);
        Bot bot = createTestBot(user, "Store Bot");

        BotUser botUser = BotUser.builder()
                .bot(bot)
                .telegramId(555666777L)
                .firstName("Bob")
                .build();
        botUser = botUserRepository.save(botUser);

        Order order = Order.builder()
                .bot(bot)
                .botUser(botUser)
                .orderNumber("ORD-1001")
                .status(OrderStatus.NEW)
                .totalAmount(BigDecimal.valueOf(99.99))
                .build();
        order = orderRepository.save(order);

        mockMvc.perform(get("/api/v1/crm/bots/" + bot.getId() + "/orders")
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].orderNumber").value("ORD-1001"));

        OrderUpdateRequest updateRequest = new OrderUpdateRequest(OrderStatus.COMPLETED, "Payment received via Stripe");

        mockMvc.perform(patch("/api/v1/crm/orders/" + order.getId())
                        .header("Authorization", getAuthHeader(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        Order updated = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OrderStatus.COMPLETED);
    }
}
