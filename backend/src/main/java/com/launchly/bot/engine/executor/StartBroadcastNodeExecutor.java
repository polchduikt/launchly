package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import java.util.List;

@Component
public class StartBroadcastNodeExecutor implements NodeExecutor {

    @Override
    public NodeType getType() {
        return NodeType.START_BROADCAST;
    }

    @Override
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                          Update update, TelegramClient client) {
        return edges.stream()
                .filter(e -> e.source().equals(node.id()))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);
    }
}
