package com.launchly.bot.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class FlowCollaborationControllerTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private FlowCollaborationController collaborationController;

    @Test
    @DisplayName("handlePresence - Should relay presence payload to destination topic")
    void handlePresence_Success() {
        String payload = "{\"userId\": 1, \"x\": 100, \"y\": 200}";

        collaborationController.handlePresence(10L, "main", payload);

        verify(messagingTemplate, times(1)).convertAndSend("/topic/presence/10/main", payload);
    }

    @Test
    @DisplayName("handleFlowUpdate - Should relay flow update payload to destination topic")
    void handleFlowUpdate_Success() {
        String payload = "{\"nodeId\": \"node_1\", \"action\": \"update\"}";

        collaborationController.handleFlowUpdate(10L, "main", payload);

        verify(messagingTemplate, times(1)).convertAndSend("/topic/collaboration/10/main/update", payload);
    }

    @Test
    @DisplayName("handleNodeMove - Should relay node move coordinates to destination topic")
    void handleNodeMove_Success() {
        String payload = "{\"nodeId\": \"node_1\", \"position\": {\"x\": 50, \"y\": 80}}";

        collaborationController.handleNodeMove(10L, "main", payload);

        verify(messagingTemplate, times(1)).convertAndSend("/topic/collaboration/10/main/move", payload);
    }
}
