package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.engine.model.Position;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.service.BotDialogStateService;
import com.launchly.crm.service.CrmService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeadAndOrderNodeExecutorTest {

    @Mock
    private BotDialogStateService stateService;

    @Mock
    private CrmService crmService;

    @Mock
    private TelegramClient telegramClient;

    private final Position pos = new Position(0.0, 0.0);

    @Test
    @DisplayName("LeadNodeExecutor should capture lead, save session data, notify CRM, and follow edge")
    void leadNodeExecutor_Success() throws Exception {
        LeadNodeExecutor executor = new LeadNodeExecutor(stateService, crmService);
        assertThat(executor.getType()).isEqualTo(NodeType.LEAD);

        Bot bot = Bot.builder().name("StoreBot").build();
        bot.setId(2L);
        BotUser botUser = BotUser.builder().bot(bot).telegramId(222L).firstName("Alice").lastName("Wonder").build();
        botUser.setId(7L);

        when(stateService.getSessionData(2L, 222L)).thenReturn(Map.of());

        FlowNode node = new FlowNode("lead-1", NodeType.LEAD, Map.of(
                "name", "Alice Wonder",
                "email", "alice@example.com",
                "phone", "+380501112233",
                "message", "Lead captured successfully!"
        ), pos);

        List<FlowEdge> edges = List.of(new FlowEdge("e1", "lead-1", "thank-you-node", null));

        String nextNode = executor.execute(node, edges, botUser, new Update(), telegramClient);

        assertThat(nextNode).isEqualTo("thank-you-node");
        verify(stateService).setSessionData(2L, 222L, "lead_name", "Alice Wonder");
        verify(crmService).createLead(2L, 7L, "Alice Wonder", "alice@example.com", "+380501112233", null);
        verify(telegramClient).execute(any(SendMessage.class));
    }

    @Test
    @DisplayName("OrderNodeExecutor should create order in CRM, record session state, and follow edge")
    void orderNodeExecutor_Success() throws Exception {
        OrderNodeExecutor executor = new OrderNodeExecutor(stateService, crmService);
        assertThat(executor.getType()).isEqualTo(NodeType.ORDER);

        Bot bot = Bot.builder().name("StoreBot").build();
        bot.setId(2L);
        BotUser botUser = BotUser.builder().bot(bot).telegramId(222L).build();
        botUser.setId(7L);

        FlowNode node = new FlowNode("order-1", NodeType.ORDER, Map.of(
                "productName", "Standard Subscription",
                "price", "299.99",
                "currency", "UAH",
                "message", "Order placed! Thank you."
        ), pos);

        List<FlowEdge> edges = List.of(new FlowEdge("e1", "order-1", "order-success", null));

        String nextNode = executor.execute(node, edges, botUser, new Update(), telegramClient);

        assertThat(nextNode).isEqualTo("order-success");
        verify(stateService).setSessionData(2L, 222L, "last_order_product", "Standard Subscription");
        verify(crmService).createOrder(eq(2L), eq(7L), eq("Standard Subscription"), eq(new BigDecimal("299.99")), eq("UAH"));
        verify(telegramClient).execute(any(SendMessage.class));
    }
}
