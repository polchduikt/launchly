package com.launchly.bot.engine.router;

import com.launchly.bot.engine.cache.FlowSchemaCache;
import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.FlowSchema;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.service.BotDialogStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class FlowNodeRouter {

    private final FlowSchemaCache schemaCache;
    private final ObjectMapper objectMapper;

    public String resolveCurrentNodeId(Long botId, Long telegramUserId, BotUser botUser, List<FlowNode> nodes, BotDialogStateService stateService) {
        Optional<String> redisNodeId = stateService.getCurrentNodeId(botId, telegramUserId);
        if (redisNodeId.isPresent() && !redisNodeId.get().trim().isEmpty()) {
            return redisNodeId.get();
        }

        if (botUser.getCurrentNodeId() != null && !botUser.getCurrentNodeId().trim().isEmpty()) {
            stateService.setCurrentNodeId(botId, telegramUserId, botUser.getCurrentNodeId());
            return botUser.getCurrentNodeId();
        }

        return nodes.stream()
                .filter(n -> n.type() == NodeType.START || n.type() == NodeType.START_BROADCAST)
                .findFirst()
                .map(FlowNode::id)
                .orElse(null);
    }

    public FlowNode findNodeById(List<FlowNode> nodes, String nodeId) {
        return nodes.stream()
                .filter(n -> n.id().equals(nodeId))
                .findFirst()
                .orElse(null);
    }

    public String findTargetNodeId(List<FlowEdge> edges, String sourceNodeId, String sourceHandle) {
        return edges.stream()
                .filter(e -> e.source().equals(sourceNodeId) && sourceHandle.equals(e.sourceHandle()))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);
    }

    @SuppressWarnings("unchecked")
    public String resolveButtonLabel(Long botId, String callbackData) {
        if (callbackData == null || callbackData.isBlank()) {
            return "";
        }
        try {
            FlowSchema schema = schemaCache.getSchema(botId);
            if (schema == null || schema.getNodes() == null) {
                return callbackData;
            }

            List<FlowNode> nodes = objectMapper.readValue(schema.getNodes(), new TypeReference<>() {});
            for (FlowNode node : nodes) {
                if (node.data() == null) continue;

                Object topBtnsObj = node.data().get("buttons");
                if (topBtnsObj instanceof List<?> topBtns) {
                    for (Object btnObj : topBtns) {
                        if (btnObj instanceof Map<?, ?> btn) {
                            Object val = btn.get("value");
                            Object id = btn.get("id");
                            Object targetNodeId = btn.get("targetNodeId");
                            if (callbackData.equalsIgnoreCase(String.valueOf(val))
                                    || callbackData.equalsIgnoreCase(String.valueOf(id))
                                    || callbackData.equalsIgnoreCase(String.valueOf(targetNodeId))) {
                                Object label = btn.get("label");
                                if (label == null) label = btn.get("text");
                                if (label == null) label = btn.get("name");
                                if (label != null && !label.toString().isBlank()) {
                                    return label.toString();
                                }
                            }
                        }
                    }
                }

                Object blocksObj = node.data().get("blocks");
                if (blocksObj instanceof List<?> blocks) {
                    for (Object blockObj : blocks) {
                        if (blockObj instanceof Map<?, ?> block) {
                            Object btnsObj = block.get("buttons");
                            if (btnsObj instanceof List<?> buttons) {
                                for (Object btnObj : buttons) {
                                    if (btnObj instanceof Map<?, ?> btn) {
                                        Object val = btn.get("value");
                                        Object id = btn.get("id");
                                        Object targetNodeId = btn.get("targetNodeId");
                                        if (callbackData.equalsIgnoreCase(String.valueOf(val))
                                                || callbackData.equalsIgnoreCase(String.valueOf(id))
                                                || callbackData.equalsIgnoreCase(String.valueOf(targetNodeId))) {
                                            Object label = btn.get("label");
                                            if (label == null) label = btn.get("text");
                                            if (label == null) label = btn.get("name");
                                            if (label != null && !label.toString().isBlank()) {
                                                return label.toString();
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to resolve button label for callback data {} in bot {}: {}", callbackData, botId, e.getMessage());
        }
        return callbackData;
    }
}
