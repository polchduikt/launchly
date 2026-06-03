package com.launchly.bot.telegram;

import com.launchly.bot.service.FlowEngineService;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.repository.BotRepository;
import com.launchly.common.exception.AppException;
import com.launchly.common.utils.EncryptionUtil;
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
    private final EncryptionUtil encryptionUtil;
    private final FlowEngineService flowEngineService;

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
            TelegramClient telegramClient = new OkHttpTelegramClient(token);

            TelegramBotsLongPollingApplication pollingApp = new TelegramBotsLongPollingApplication();
            BotUpdateHandler handler = new BotUpdateHandler(bot.getId(), flowEngineService, telegramClient);
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
                log.info("Unregistered bot {}", botId);
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
