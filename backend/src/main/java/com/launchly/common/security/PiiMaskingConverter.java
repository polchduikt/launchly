package com.launchly.common.security;

import ch.qos.logback.classic.pattern.MessageConverter;
import ch.qos.logback.classic.spi.ILoggingEvent;
import com.launchly.common.utils.MaskingUtil;

public class PiiMaskingConverter extends MessageConverter {

    @Override
    public String convert(ILoggingEvent event) {
        if (event == null || event.getFormattedMessage() == null) {
            return "";
        }
        return MaskingUtil.maskMessage(event.getFormattedMessage());
    }
}
