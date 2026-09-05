package com.launchly.bot.engine.executor.block;

import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.InlineKeyboardMarkup;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import java.util.Map;

public record MessageBlockContext(
        Map<String, Object> block,
        FlowNode node,
        BotUser botUser,
        String chatId,
        Map<String, String> sessionData,
        InlineKeyboardMarkup markup,
        TelegramClient client,
        int blockIndex,
        int lastSendableIndex
) {}
