package com.launchly.bot.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class FlowCollaborationController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/presence/{botId}/{type}")
    public void handlePresence(
            @DestinationVariable Long botId,
            @DestinationVariable String type,
            @Payload String payload) {
        String destination = "/topic/presence/" + botId + "/" + type;
        messagingTemplate.convertAndSend(destination, payload);
    }

    @MessageMapping("/collaboration/{botId}/{type}/update")
    public void handleFlowUpdate(
            @DestinationVariable Long botId,
            @DestinationVariable String type,
            @Payload String payload) {
        String destination = "/topic/collaboration/" + botId + "/" + type + "/update";
        messagingTemplate.convertAndSend(destination, payload);
        log.debug("Collaboration: relayed flow update for bot {} type {}", botId, type);
    }

    @MessageMapping("/collaboration/{botId}/{type}/move")
    public void handleNodeMove(
            @DestinationVariable Long botId,
            @DestinationVariable String type,
            @Payload String payload) {
        String destination = "/topic/collaboration/" + botId + "/" + type + "/move";
        messagingTemplate.convertAndSend(destination, payload);
    }
}
