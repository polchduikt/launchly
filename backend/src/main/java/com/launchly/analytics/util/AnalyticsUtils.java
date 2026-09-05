package com.launchly.analytics.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.FlowSchema;
import com.launchly.bot.repository.FlowSchemaRepository;
import lombok.extern.slf4j.Slf4j;
import java.util.List;
import java.util.Map;

@Slf4j
public final class AnalyticsUtils {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private AnalyticsUtils() {
    }

    public static double calculateGrowth(long prev, long curr) {
        if (prev == 0) {
            return curr * 100.0;
        }
        double diff = (double) curr - prev;
        double growth = (diff / prev) * 100.0;
        return Math.round(growth * 10.0) / 10.0;
    }

    @SuppressWarnings("unchecked")
    public static String resolveButtonLabel(FlowSchemaRepository flowSchemaRepository, List<Long> botIds, String callbackData) {
        if (callbackData == null) {
            return "Unknown Button";
        }
        if (flowSchemaRepository == null || botIds == null) {
            return callbackData;
        }
        for (Long bId : botIds) {
            try {
                FlowSchema schema = flowSchemaRepository.findByBotId(bId).orElse(null);
                if (schema != null && schema.getNodes() != null) {
                    List<FlowNode> nodes = OBJECT_MAPPER.readValue(
                            schema.getNodes(),
                            new TypeReference<List<FlowNode>>() {}
                    );
                    for (FlowNode node : nodes) {
                        Map<String, Object> data = node.data();
                        if (data == null) continue;

                        List<?> topLevelButtons = (List<?>) data.get("buttons");
                        if (topLevelButtons != null) {
                            for (Object btnObj : topLevelButtons) {
                                if (btnObj instanceof Map<?, ?> btn) {
                                    Object val = btn.get("value");
                                    Object id = btn.get("id");
                                    Object target = btn.get("targetNodeId");
                                    if (callbackData.equalsIgnoreCase(String.valueOf(val))
                                            || callbackData.equalsIgnoreCase(String.valueOf(id))
                                            || callbackData.equalsIgnoreCase(String.valueOf(target))) {
                                        Object label = btn.get("label");
                                        if (label == null) label = btn.get("text");
                                        if (label == null) label = btn.get("name");
                                        if (label != null && !label.toString().isBlank()) return label.toString();
                                    }
                                }
                            }
                        }

                        List<Map<String, Object>> blocks = (List<Map<String, Object>>) data.get("blocks");
                        if (blocks != null) {
                            for (Map<String, Object> block : blocks) {
                                List<?> blockButtons = (List<?>) block.get("buttons");
                                if (blockButtons != null) {
                                    for (Object btnObj : blockButtons) {
                                        if (btnObj instanceof Map<?, ?> btn) {
                                            Object val = btn.get("value");
                                            Object id = btn.get("id");
                                            Object target = btn.get("targetNodeId");
                                            if (callbackData.equalsIgnoreCase(String.valueOf(val))
                                                    || callbackData.equalsIgnoreCase(String.valueOf(id))
                                                    || callbackData.equalsIgnoreCase(String.valueOf(target))) {
                                                Object label = btn.get("label");
                                                if (label == null) label = btn.get("text");
                                                if (label == null) label = btn.get("name");
                                                if (label != null && !label.toString().isBlank()) return label.toString();
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.debug("Failed to resolve button label from botId {}: {}", bId, e.getMessage());
            }
        }
        return callbackData;
    }
}
