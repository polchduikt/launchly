package com.launchly.bot.telegram;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.launchly.bot.service.FlowEngineService;
import com.launchly.bot.constant.BotConstants;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.common.utils.EncryptionUtil;
import com.launchly.crm.service.CrmService;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.client.okhttp.OkHttpTelegramClient;
import org.telegram.telegrambots.longpolling.TelegramBotsLongPollingApplication;
import org.springframework.web.client.RestTemplate;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;
import java.util.concurrent.locks.ReentrantLock;

@Slf4j
@Component
@RequiredArgsConstructor
public class TelegramBotManager implements TelegramClientProvider {

    private final BotRepository botRepository;
    private final BotUserRepository botUserRepository;
    private final EncryptionUtil encryptionUtil;
    private final FlowEngineService flowEngineService;
    private final CrmService crmService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    @Qualifier("taskExecutor")
    private final Executor taskExecutor;

    @Value("${telegram.mode:polling}")
    private String mode;

    @Value("${telegram.system-bot-token:}")
    private String systemBotToken;

    @Value("${telegram.system-bot-username:}")
    private String systemBotUsername;

    private final ConcurrentHashMap<Long, TelegramBotsLongPollingApplication> activeBots = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, TelegramClient> telegramClients = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, ReentrantLock> botLocks = new ConcurrentHashMap<>();

    private ReentrantLock getBotLock(Long botId) {
        return botLocks.computeIfAbsent(botId, k -> new ReentrantLock());
    }

    @EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void init() {
        if (!"polling".equalsIgnoreCase(mode)) {
            log.info("Telegram bot manager running in webhook mode, skipping auto-start");
            return;
        }

        if (systemBotToken != null && !systemBotToken.isBlank()) {
            try {
                registerSystemBot();
                log.info("Started system bot: {}", systemBotUsername);
            } catch (Exception e) {
                log.error("Failed to start system bot: {}", e.getMessage());
            }
        }

        taskExecutor.execute(() -> {
            try {
                List<Bot> bots = botRepository.findAllByActiveTrue();
                log.info("Starting {} active bots in background", bots.size());

                for (Bot bot : bots) {
                    taskExecutor.execute(() -> {
                        try {
                            registerBot(bot);
                        } catch (Exception e) {
                            log.error("Failed to start bot {} (id={}): {}", bot.getName(), bot.getId(), e.getMessage());
                        }
                    });
                }
                log.info("Dispatched active bots background startup tasks");
            } catch (Exception e) {
                log.error("Error during background bots startup: {}", e.getMessage());
            }
        });
    }

    public void registerBot(Bot bot) {
        if (bot == null || bot.getId() == null) {
            return;
        }
        if (activeBots.containsKey(bot.getId())) {
            return;
        }

        getBotLock(bot.getId()).lock();
        try {
            if (activeBots.containsKey(bot.getId())) {
                return;
            }

            String token = encryptionUtil.decrypt(bot.getTelegramToken());

            if (token == null || token.isBlank() || BotConstants.DUMMY_TOKEN_PLACEHOLDER.equals(token)) {
                log.info("Skipping registration for bot {} (id={}): dummy token placeholder", bot.getName(), bot.getId());
                return;
            }

            TelegramClient telegramClient = new OkHttpTelegramClient(token);
            telegramClients.put(bot.getId(), telegramClient);

            for (Long activeId : activeBots.keySet()) {
                if (!activeId.equals(bot.getId()) && activeId > 0) {
                    try {
                        botRepository.findById(activeId).ifPresent(other -> {
                            String otherToken = encryptionUtil.decrypt(other.getTelegramToken());
                            if (token.equals(otherToken)) {
                                log.info("Unregistering conflicting active bot id={} sharing token with bot id={}", activeId, bot.getId());
                                unregisterBot(activeId);
                            }
                        });
                    } catch (Exception e) {
                        log.warn("Error checking conflicting bot id={}: {}", activeId, e.getMessage());
                    }
                }
            }

            if (bot.getUsername() == null || bot.getUsername().isBlank()) {
                try {
                    String url = "https://api.telegram.org/bot" + token + "/getMe";
                    org.springframework.http.ResponseEntity<String> responseEntity = restTemplate.getForEntity(url, String.class);
                    if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                        JsonNode root = objectMapper.readTree(responseEntity.getBody());
                        if (root.has("ok") && root.get("ok").asBoolean()) {
                            JsonNode result = root.get("result");
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
                    log.debug("Could not fetch Telegram bot username on startup: {}", e.getMessage());
                }
            }

            try {
                String deleteWebhookUrl = "https://api.telegram.org/bot" + token + "/deleteWebhook?drop_pending_updates=false";
                restTemplate.getForEntity(deleteWebhookUrl, String.class);
            } catch (Exception e) {
                log.debug("Could not call deleteWebhook before polling for bot {}: {}", bot.getId(), e.getMessage());
            }

            TelegramBotsLongPollingApplication pollingApp = new TelegramBotsLongPollingApplication();
            BotUpdateHandler handler = new BotUpdateHandler(
                    bot.getId(), flowEngineService, telegramClient, crmService, botUserRepository);
            pollingApp.registerBot(token, handler);
            activeBots.put(bot.getId(), pollingApp);
            log.info("Registered bot {} for long polling", bot.getId());
        } catch (Exception e) {
            log.warn("Could not start external long polling for bot {} (offline/test mode): {}", bot.getId(), e.getMessage());
        } finally {
            getBotLock(bot.getId()).unlock();
        }
    }

    private void registerSystemBot() {
        if (activeBots.containsKey(-1L)) {
            return;
        }

        getBotLock(-1L).lock();
        try {
            if (activeBots.containsKey(-1L)) {
                return;
            }

            try {
                String deleteWebhookUrl = "https://api.telegram.org/bot" + systemBotToken + "/deleteWebhook?drop_pending_updates=false";
                restTemplate.getForEntity(deleteWebhookUrl, String.class);
            } catch (Exception e) {
                log.warn("Failed to call deleteWebhook before polling for system bot: {}", e.getMessage());
            }

            TelegramClient telegramClient = new OkHttpTelegramClient(systemBotToken);
            TelegramBotsLongPollingApplication pollingApp = new TelegramBotsLongPollingApplication();
            BotUpdateHandler handler = new BotUpdateHandler(
                    -1L, flowEngineService, telegramClient, crmService, botUserRepository);
            pollingApp.registerBot(systemBotToken, handler);
            activeBots.put(-1L, pollingApp);
            telegramClients.put(-1L, telegramClient);
            log.info("Registered system bot for long polling");
        } catch (Exception e) {
            log.error("Failed to register system bot: {}", e.getMessage());
        } finally {
            getBotLock(-1L).unlock();
        }
    }

    public void unregisterBot(Long botId) {
        getBotLock(botId).lock();
        try {
            TelegramBotsLongPollingApplication app = activeBots.remove(botId);
            telegramClients.remove(botId);
            if (app != null) {
                try {
                    app.close();
                    log.info("Unregistered bot {}", botId);
                } catch (Exception e) {
                    log.error("Error closing bot {}: {}", botId, e.getMessage());
                }
            }
        } finally {
            getBotLock(botId).unlock();
        }
    }

    @Override
    public TelegramClient getTelegramClient(Long botId) {
        TelegramClient client = telegramClients.get(botId);
        if (client == null && botId != null && botId > 0) {
            try {
                Bot bot = botRepository.findById(botId).orElse(null);
                if (bot != null && bot.getTelegramToken() != null) {
                    String token = encryptionUtil.decrypt(bot.getTelegramToken());
                    if (token != null && !token.isBlank() && !BotConstants.DUMMY_TOKEN_PLACEHOLDER.equals(token)) {
                        TelegramClient newClient = new OkHttpTelegramClient(token);
                        TelegramClient existing = telegramClients.putIfAbsent(botId, newClient);
                        client = existing != null ? existing : newClient;
                    }
                }
            } catch (Exception e) {
                log.debug("Could not lazy load telegram client for bot {}: {}", botId, e.getMessage());
            }
        }
        return client;
    }

    @PreDestroy
    void shutdown() {
        log.info("Shutting down {} active bots", activeBots.size());
        activeBots.forEach((id, app) -> {
            getBotLock(id).lock();
            try {
                app.close();
            } catch (Exception e) {
                log.error("Error shutting down bot {}: {}", id, e.getMessage());
            } finally {
                getBotLock(id).unlock();
            }
        });
        activeBots.clear();
        telegramClients.clear();
    }
}
