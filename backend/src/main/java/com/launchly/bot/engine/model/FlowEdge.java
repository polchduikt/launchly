package com.launchly.bot.engine.model;

public record FlowEdge(
        String id,
        String source,
        String target,
        String sourceHandle
) {}
