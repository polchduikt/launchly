package com.launchly.bot.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Tag(name = "Bot: Real-time Flow Collaboration (WebSocket)", description = "STOMP WebSocket message broker for multi-user canvas collaboration, presence cursors, and live node movements")
@Slf4j
@Controller
@RequiredArgsConstructor
public class FlowCollaborationController {

    private final SimpMessagingTemplate messagingTemplate;

    @Operation(summary = "Broadcast presence and cursor position", description = "Relays user presence and cursor coordinates to subscribers on /topic/presence/{botId}/{type}")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Presence payload broadcasted to topic")
    })
    @MessageMapping("/presence/{botId}/{type}")
    public void handlePresence(
            @Parameter(description = "Bot ID") @DestinationVariable Long botId,
            @Parameter(description = "Flow type (e.g. main, onboarding)") @DestinationVariable String type,
            @RequestBody(description = "JSON containing user presence and cursor position { userId, userName, color, cursor: {x, y} }") @Payload String payload) {
        String destination = "/topic/presence/" + botId + "/" + type;
        messagingTemplate.convertAndSend(destination, payload);
    }

    @Operation(summary = "Relay flow schema updates", description = "Broadcasts node property changes and schema modifications to subscribers on /topic/collaboration/{botId}/{type}/update")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Flow update broadcasted to topic")
    })
    @MessageMapping("/collaboration/{botId}/{type}/update")
    public void handleFlowUpdate(
            @Parameter(description = "Bot ID") @DestinationVariable Long botId,
            @Parameter(description = "Flow type") @DestinationVariable String type,
            @RequestBody(description = "JSON containing updated schema delta or node properties") @Payload String payload) {
        String destination = "/topic/collaboration/" + botId + "/" + type + "/update";
        messagingTemplate.convertAndSend(destination, payload);
        log.debug("Collaboration: relayed flow update for bot {} type {}", botId, type);
    }

    @Operation(summary = "Broadcast node drag & drop movement", description = "Relays real-time node coordinates to subscribers on /topic/collaboration/{botId}/{type}/move")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Node position broadcasted to topic")
    })
    @MessageMapping("/collaboration/{botId}/{type}/move")
    public void handleNodeMove(
            @Parameter(description = "Bot ID") @DestinationVariable Long botId,
            @Parameter(description = "Flow type") @DestinationVariable String type,
            @RequestBody(description = "JSON containing moved node coordinates { nodeId, position: {x, y} }") @Payload String payload) {
        String destination = "/topic/collaboration/" + botId + "/" + type + "/move";
        messagingTemplate.convertAndSend(destination, payload);
    }
}


