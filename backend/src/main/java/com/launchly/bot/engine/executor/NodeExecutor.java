package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import java.util.List;

public interface NodeExecutor {

    NodeType getType();

    String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                   Update update, TelegramClient client);
}
