package com.launchly.bot.engine.executor.block;

public interface MessageBlockHandler {

    String getSupportedType();

    MessageBlockResult handle(MessageBlockContext context);
}
