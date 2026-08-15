package com.launchly.common.utils;

import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;
import java.text.MessageFormat;

@Component
@RequiredArgsConstructor
public class MessageUtils {

    private final MessageSource messageSource;

    public String getMessage(String code) {
        return messageSource.getMessage(code, null, LocaleContextHolder.getLocale());
    }

    public String getMessage(String code, Object... args) {
        String msg = messageSource.getMessage(code, args, LocaleContextHolder.getLocale());
        if (args != null && args.length > 0 && msg.contains("{0}")) {
            return MessageFormat.format(msg, args);
        }
        return msg;
    }

    public String getMessageWithDefault(String code, String defaultMessage) {
        return messageSource.getMessage(code, null, defaultMessage, LocaleContextHolder.getLocale());
    }
}
