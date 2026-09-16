package com.launchly.bot.engine.action.handler;

import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.service.TelegramSendService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class NotifyContactBotActionHandlerTest {

    @Mock
    private TelegramSendService telegramSendService;

    @InjectMocks
    private NotifyContactBotActionHandler handler;

    @Test
    @DisplayName("Should return supported action types")
    void getSupportedTypes_Success() {
        assertThat(handler.getSupportedTypes()).contains("NOTIFY_CONTACT", "SEND_MESSAGE_TO_CONTACT");
    }

    @Test
    @DisplayName("Should resolve target ID and placeholders and send Telegram message")
    void execute_SendMessage_Success() {
        Bot bot = Bot.builder().name("DatingBot").build();
        bot.setId(1L);
        BotUser currentUser = BotUser.builder()
                .bot(bot)
                .telegramId(100L)
                .firstName("Alex")
                .username("alex_dev")
                .build();

        Map<String, String> sessionData = Map.of(
                "found_user.telegram_id", "200",
                "found_user.first_name", "Oksana"
        );

        Map<String, Object> action = Map.of(
                "type", "NOTIFY_CONTACT",
                "targetUserId", "{found_user.telegram_id}",
                "text", "У вас взаємне співпадіння з {first_name}! Нікнейм: @{username}"
        );

        handler.execute("NOTIFY_CONTACT", action, currentUser, sessionData);

        verify(telegramSendService).sendMessage(1L, 200L, "У вас взаємне співпадіння з Alex! Нікнейм: @alex_dev");
    }

    @Test
    @DisplayName("Should automatically resolve target ID from found_user.telegram_id when targetUserId is omitted")
    void execute_SendMessage_AutoResolveTarget_Success() {
        Bot bot = Bot.builder().name("DatingBot").build();
        bot.setId(1L);
        BotUser currentUser = BotUser.builder()
                .bot(bot)
                .telegramId(100L)
                .firstName("Alex")
                .build();

        Map<String, String> sessionData = Map.of(
                "found_user.telegram_id", "300"
        );

        Map<String, Object> action = Map.of(
                "type", "NOTIFY_CONTACT",
                "text", "Привіт від {first_name}!"
        );

        handler.execute("NOTIFY_CONTACT", action, currentUser, sessionData);

        verify(telegramSendService).sendMessage(1L, 300L, "Привіт від Alex!");
    }
}
