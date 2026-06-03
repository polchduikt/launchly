package com.launchly.bot.engine.model;

import com.launchly.bot.entity.NodeType;

import java.util.Map;

public record FlowNode(
        String id,
        NodeType type,
        Map<String, Object> data,
        Position position
) {}
