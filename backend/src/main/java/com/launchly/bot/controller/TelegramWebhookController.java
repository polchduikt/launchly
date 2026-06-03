package com.launchly.bot.controller;

import com.launchly.bot.service.FlowEngineService;
import com.launchly.bot.telegram.TelegramBotManager;
import com.launchly.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

@RestController
@RequestMapping("/api/v1/telegram/webhook")
@RequiredArgsConstructor
public class TelegramWebhookController {

    private final FlowEngineService flowEngineService;
    private final TelegramBotManager telegramBotManager;

    @PostMapping("/{botId}")
    public ResponseEntity<Void> handleUpdate(@PathVariable Long botId,
                                              @RequestBody Update update) {
        TelegramClient client = telegramBotManager.getTelegramClient(botId);
        if (client == null) {
            throw new AppException(HttpStatus.NOT_FOUND, "Bot not found or not active");
        }

        flowEngineService.processUpdate(botId, update, client);
        return ResponseEntity.ok().build();
    }
}
