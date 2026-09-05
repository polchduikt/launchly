package com.launchly.crm.listener;

import com.launchly.bot.service.TelegramSendService;
import com.launchly.crm.event.CrmOutgoingMessageEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class CrmTelegramMessageListener {

    private final TelegramSendService telegramSendService;

    @EventListener
    public void handleOutgoingMessage(CrmOutgoingMessageEvent event) {
        try {
            if (event.mediaUrl() != null && !event.mediaUrl().isBlank()) {
                telegramSendService.sendPhoto(event.botId(), event.telegramUserId(), event.mediaUrl(), event.content());
            } else {
                telegramSendService.sendMessage(event.botId(), event.telegramUserId(), event.content());
            }
        } catch (Exception e) {
            log.error("Failed to send telegram message for bot {}: {}", event.botId(), e.getMessage(), e);
        }
    }
}
