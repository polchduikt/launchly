package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.service.BotDialogStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class InputNodeExecutor implements NodeExecutor {

    private final BotDialogStateService stateService;

    @Override
    public NodeType getType() {
        return NodeType.INPUT;
    }

    @Override
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                          Update update, TelegramClient client) {
        Long botId = botUser.getBot().getId();
        Long telegramUserId = botUser.getTelegramId();
        Map<String, Object> data = node.data();
        String inputKey = data != null ? (String) data.getOrDefault("variableName", "input") : "input";

        Optional<String> expectedInput = stateService.getExpectedInput(botId, telegramUserId);

        if (expectedInput.isPresent() && update.hasMessage() && update.getMessage().hasText()) {
            String userInput = update.getMessage().getText();
            stateService.setSessionData(botId, telegramUserId, inputKey, userInput);
            stateService.clearExpectedInput(botId, telegramUserId);

            return edges.stream()
                    .filter(e -> e.source().equals(node.id()))
                    .findFirst()
                    .map(FlowEdge::target)
                    .orElse(null);
        }

        String prompt = data != null ? (String) data.getOrDefault("text", "Please enter a value:") : "Please enter a value:";
        String chatId = botUser.getTelegramId().toString();

        try {
            SendMessage message = SendMessage.builder()
                    .chatId(chatId)
                    .text(prompt)
                    .build();
            client.execute(message);
        } catch (TelegramApiException e) {
            log.error("Failed to send input prompt to chat {}: {}", chatId, e.getMessage());
        }

        stateService.setExpectedInput(botId, telegramUserId, inputKey);
        return null;
    }
}
