package com.launchly.admin.validator;

import com.launchly.bot.entity.Bot;
import com.launchly.common.utils.EncryptionUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BotTokenValidator {

    private static final String DUMMY_TOKEN = "0000000000:dummyTokenPlaceholderForNoBotConfig";

    private final EncryptionUtil encryptionUtil;

    public boolean isConnected(Bot bot) {
        if (bot == null) return false;
        String rawToken = bot.getTelegramToken();
        if (rawToken == null || rawToken.isBlank()) return false;
        try {
            String decrypted = encryptionUtil.decrypt(rawToken);
            return decrypted != null && !decrypted.isBlank() && !DUMMY_TOKEN.equals(decrypted);
        } catch (Exception e) {
            return false;
        }
    }

    public String resolveBotName(Bot bot) {
        if (!isConnected(bot)) return "\u2014";
        return bot.getName() != null && !bot.getName().isBlank() ? bot.getName() : "\u2014";
    }
}
