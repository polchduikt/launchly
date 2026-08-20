package com.launchly.bot.service;

public interface TelegramWebhookService {
    void processWebhookUpdate(Long botId, String rawUpdate);
}
