package com.launchly.bot.engine.executor;

import com.launchly.ai.dto.AiMessage;
import com.launchly.ai.service.AiProviderRouter;
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
public class AiNodeExecutor implements NodeExecutor {

    private final BotDialogStateService stateService;
    private final AiProviderRouter aiProviderRouter;

    @Override
    public NodeType getType() {
        return NodeType.AI;
    }

    @Override
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                          Update update, TelegramClient client) {
        Long botId = botUser.getBot().getId();
        Long telegramUserId = botUser.getTelegramId();
        String chatId = telegramUserId.toString();
        Map<String, Object> data = node.data();

        String prompt = data != null ? (String) data.getOrDefault("prompt", "") : "";
        String context = data != null ? (String) data.getOrDefault("context", "") : "";

        Optional<String> expectedInput = stateService.getExpectedInput(botId, telegramUserId);

        if (expectedInput.isPresent() && "ai_input".equals(expectedInput.get())
                && update != null && update.hasMessage() && update.getMessage().hasText()) {
            
            String userInput = update.getMessage().getText();
            stateService.clearExpectedInput(botId, telegramUserId);

            String aiResponse;
            try {
                List<AiMessage> messages = List.of(
                    new AiMessage("system", "You are an AI assistant in a Telegram chatbot. Your goal is: " + prompt + ". Context: " + context),
                    new AiMessage("user", userInput)
                );
                aiResponse = aiProviderRouter.chat(messages, null);
            } catch (Exception e) {
                log.warn("Failed to generate AI response for bot {}, falling back: {}", botId, e.getMessage());
                aiResponse = "I am processing your request. Please write again shortly.";
            }

            try {
                SendMessage message = SendMessage.builder()
                        .chatId(chatId)
                        .text(aiResponse)
                        .build();
                client.execute(message);
            } catch (TelegramApiException e) {
                log.error("Failed to send AI response to chat {}: {}", chatId, e.getMessage());
            }

            String nextNodeId = edges.stream()
                    .filter(e -> e.source().equals(node.id()))
                    .findFirst()
                    .map(FlowEdge::target)
                    .orElse(null);

            if (nextNodeId == null) {
                stateService.setExpectedInput(botId, telegramUserId, "ai_input");
            } else {
                stateService.clearExpectedInput(botId, telegramUserId);
            }

            return nextNodeId;
        }

        String greeting;
        try {
            List<AiMessage> messages = List.of(
                new AiMessage("system", "You are a helpful AI assistant. Greet the user and briefly introduce your goal: " + prompt + ". Context: " + context + ". Keep it short (1-2 sentences)."),
                new AiMessage("user", "Hello")
            );
            greeting = aiProviderRouter.chat(messages, null);
        } catch (Exception e) {
            log.warn("Failed to generate AI greeting, falling back: {}", e.getMessage());
            if (prompt != null && !prompt.isBlank()) {
                greeting = "Hello! I am here to help you with: " + prompt + ". What would you like to know?";
            } else {
                greeting = "Hello! I am here to assist you. How can I help you today?";
            }
        }

        try {
            SendMessage message = SendMessage.builder()
                    .chatId(chatId)
                    .text(greeting)
                    .build();
            client.execute(message);
        } catch (TelegramApiException e) {
            log.error("Failed to send AI greeting to chat {}: {}", chatId, e.getMessage());
        }

        stateService.setExpectedInput(botId, telegramUserId, "ai_input");
        return null;
    }
}
