package com.launchly.bot.engine.executor.block;

public record MessageBlockResult(boolean hasButtons, boolean haltFlow) {

    public static MessageBlockResult ok(boolean hasButtons) {
        return new MessageBlockResult(hasButtons, false);
    }

    public static MessageBlockResult halt() {
        return new MessageBlockResult(false, true);
    }
}
