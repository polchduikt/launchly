package com.launchly.bot.engine.executor.block;

import com.launchly.bot.constant.BotConstants;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
public class DelayMessageBlockHandler implements MessageBlockHandler {

    @Override
    public String getSupportedType() {
        return "delay";
    }

    @Override
    public MessageBlockResult handle(MessageBlockContext context) {
        Map<String, Object> block = context.block();
        int delaySeconds = BotConstants.DEFAULT_DELAY_SECONDS;
        Object delayObj = block.get("delaySeconds");
        if (delayObj instanceof Number number) {
            delaySeconds = number.intValue();
        } else if (delayObj instanceof String str) {
            try {
                delaySeconds = Integer.parseInt(str);
            } catch (NumberFormatException e) {
                log.warn("Invalid delaySeconds string '{}' in node {}, fallback to default", delayObj, context.node().id());
            }
        }

        try {
            Thread.sleep(delaySeconds * 1000L);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Delay interrupted in node {}", context.node().id());
        }

        return MessageBlockResult.ok(false);
    }
}
