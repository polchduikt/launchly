package com.launchly.bot.telegram;

import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.service.FlowEngineService;
import com.launchly.crm.service.CrmService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.telegram.telegrambots.longpolling.util.LongPollingSingleThreadUpdateConsumer;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

@Slf4j
@RequiredArgsConstructor
public class BotUpdateHandler implements LongPollingSingleThreadUpdateConsumer {

    private final Long botId;
    private final FlowEngineService flowEngineService;
    private final TelegramClient telegramClient;
    private final CrmService crmService;
    private final BotUserRepository botUserRepository;

    @Override
    public void consume(Update update) {
        try {
            saveIncomingMessageToCrm(update);
            flowEngineService.processUpdate(botId, update, telegramClient);
        } catch (Exception e) {
            log.error("Error handling update for bot {}: {}", botId, e.getMessage(), e);
        }
    }

    private void saveIncomingMessageToCrm(Update update) {
        try {
            Long telegramUserId = null;
            String text = null;

            if (update.hasMessage()) {
                telegramUserId = update.getMessage().getFrom().getId();
                if (update.getMessage().hasText()) {
                    text = update.getMessage().getText();
                } else if (update.getMessage().hasVoice()) {
                    text = "🎤 Voice message";
                } else if (update.getMessage().hasPhoto()) {
                    String caption = update.getMessage().getCaption();
                    text = caption != null && !caption.isBlank() ? "📷 " + caption : "📷 Photo";
                } else if (update.getMessage().hasDocument()) {
                    text = "📎 Document";
                }
            } else if (update.hasCallbackQuery()) {
                var callbackQuery = update.getCallbackQuery();
                telegramUserId = callbackQuery.getFrom().getId();
                String data = callbackQuery.getData();

                // Try to find the button label in the original message's inline keyboard
                String label = null;
                if (callbackQuery.getMessage() instanceof org.telegram.telegrambots.meta.api.objects.message.Message origMsg) {
                    if (origMsg.hasReplyMarkup()) {
                        var markup = origMsg.getReplyMarkup();
                        if (markup.getKeyboard() != null) {
                            for (var row : markup.getKeyboard()) {
                                for (var btn : row) {
                                    if (data.equals(btn.getCallbackData())) {
                                        label = btn.getText();
                                        break;
                                    }
                                }
                                if (label != null) break;
                            }
                        }
                    }
                }

                // If label was not found, fallback to callback data text
                if (label == null || label.isBlank()) {
                    label = data;
                }

                text = "🖱️ " + label;
            }

            if (telegramUserId == null || text == null) return;

            final String finalText = text;
            botUserRepository.findByTelegramIdAndBotId(telegramUserId, botId)
                    .ifPresent(botUser ->
                            crmService.saveIncomingMessage(botId, botUser.getId(), finalText));
        } catch (Exception e) {
            log.warn("Failed to save incoming message to CRM for bot {}: {}", botId, e.getMessage(), e);
        }
    }
}
