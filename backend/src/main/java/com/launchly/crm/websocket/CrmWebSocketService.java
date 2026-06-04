package com.launchly.crm.websocket;

import com.launchly.crm.dto.response.LeadResponse;
import com.launchly.crm.dto.response.MessageResponse;
import com.launchly.crm.dto.response.OrderResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class CrmWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public void notifyNewOrder(Long botId, OrderResponse order) {
        String destination = "/topic/crm/" + botId + "/orders";
        messagingTemplate.convertAndSend(destination, order);
        log.debug("WebSocket: sent new order {} to {}", order.orderNumber(), destination);
    }

    public void notifyNewLead(Long botId, LeadResponse lead) {
        String destination = "/topic/crm/" + botId + "/leads";
        messagingTemplate.convertAndSend(destination, lead);
        log.debug("WebSocket: sent new lead {} to {}", lead.id(), destination);
    }

    public void notifyNewMessage(Long botId, MessageResponse message) {
        String destination = "/topic/crm/" + botId + "/messages";
        messagingTemplate.convertAndSend(destination, message);
        log.debug("WebSocket: sent new message {} to {}", message.id(), destination);
    }

    public void notifyOrderUpdate(Long botId, OrderResponse order) {
        String destination = "/topic/crm/" + botId + "/orders";
        messagingTemplate.convertAndSend(destination, order);
        log.debug("WebSocket: sent order update {} to {}", order.orderNumber(), destination);
    }

    public void notifyLeadUpdate(Long botId, LeadResponse lead) {
        String destination = "/topic/crm/" + botId + "/leads";
        messagingTemplate.convertAndSend(destination, lead);
        log.debug("WebSocket: sent lead update {} to {}", lead.id(), destination);
    }
}
