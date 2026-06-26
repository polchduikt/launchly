package com.launchly.bot.telegram;

import com.launchly.bot.service.FlowEngineService;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.common.exception.AppException;
import com.launchly.common.utils.EncryptionUtil;
import com.launchly.crm.service.CrmService;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.client.okhttp.OkHttpTelegramClient;
import org.telegram.telegrambots.longpolling.TelegramBotsLongPollingApplication;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class TelegramBotManager {

    private final BotRepository botRepository;
    private final BotUserRepository botUserRepository;
    private final EncryptionUtil encryptionUtil;
    private final FlowEngineService flowEngineService;
    private final CrmService crmService;

    @Value("${telegram.mode:polling}")
    private String mode;

    private final ConcurrentHashMap<Long, TelegramBotsLongPollingApplication> activeBots = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, TelegramClient> telegramClients = new ConcurrentHashMap<>();

    @PostConstruct
    void init() {
        if (!"polling".equalsIgnoreCase(mode)) {
            log.info("Telegram bot manager running in webhook mode, skipping auto-start");
            return;
        }

        List<Bot> bots = botRepository.findAllByActiveTrue();
        log.info("Starting {} active bots in polling mode", bots.size());

        for (Bot bot : bots) {
            try {
                registerBot(bot);
                log.info("Started bot: {} (id={})", bot.getName(), bot.getId());
            } catch (Exception e) {
                log.error("Failed to start bot {} (id={}): {}", bot.getName(), bot.getId(), e.getMessage());
            }
        }
    }

    public void registerBot(Bot bot) {
        if (activeBots.containsKey(bot.getId())) {
            log.warn("Bot {} is already registered", bot.getId());
            return;
        }

        try {
            String token = encryptionUtil.decrypt(bot.getTelegramToken());

            if (bot.getUsername() == null || bot.getUsername().isBlank()) {
                try {
                    String url = "https://api.telegram.org/bot" + token + "/getMe";
                    org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
                    org.springframework.http.ResponseEntity<String> responseEntity = restTemplate.getForEntity(url, String.class);
                    if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(responseEntity.getBody());
                        if (root.has("ok") && root.get("ok").asBoolean()) {
                            com.fasterxml.jackson.databind.JsonNode result = root.get("result");
                            if (result.has("username")) {
                                bot.setUsername(result.get("username").asText());
                            }
                            if (result.has("first_name")) {
                                bot.setName(result.get("first_name").asText());
                            }
                            botRepository.save(bot);
                        }
                    }
                } catch (Exception e) {
                    log.warn("Failed to fetch Telegram bot username on startup: {}", e.getMessage());
                }
            }

            try {
                String deleteWebhookUrl = "https://api.telegram.org/bot" + token + "/deleteWebhook?drop_pending_updates=false";
                org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
                restTemplate.getForEntity(deleteWebhookUrl, String.class);
                Thread.sleep(500);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                log.warn("Failed to call deleteWebhook before polling for bot {}: {}", bot.getId(), e.getMessage());
            }

            TelegramClient telegramClient = new OkHttpTelegramClient(token);
            TelegramBotsLongPollingApplication pollingApp = new TelegramBotsLongPollingApplication();
            BotUpdateHandler handler = new BotUpdateHandler(
                    bot.getId(), flowEngineService, telegramClient, crmService, botUserRepository);
            pollingApp.registerBot(token, handler);
            activeBots.put(bot.getId(), pollingApp);
            telegramClients.put(bot.getId(), telegramClient);
            log.info("Registered bot {} for long polling", bot.getId());
        } catch (Exception e) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to register bot: " + e.getMessage());
        }
    }

    public void unregisterBot(Long botId) {
        TelegramBotsLongPollingApplication app = activeBots.remove(botId);
        telegramClients.remove(botId);
        if (app != null) {
            try {
                app.close();
                Thread.sleep(500);
                log.info("Unregistered bot {}", botId);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                log.error("Error closing bot {}: {}", botId, e.getMessage());
            }
        }
    }

    public TelegramClient getTelegramClient(Long botId) {
        return telegramClients.get(botId);
    }

    @PreDestroy
    void shutdown() {
        log.info("Shutting down {} active bots", activeBots.size());
        activeBots.forEach((id, app) -> {
            try {
                app.close();
            } catch (Exception e) {
                log.error("Error shutting down bot {}: {}", id, e.getMessage());
            }
        });
        activeBots.clear();
        telegramClients.clear();
    }
}
