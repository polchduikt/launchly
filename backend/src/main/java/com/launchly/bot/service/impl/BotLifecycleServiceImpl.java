package com.launchly.bot.service.impl;

import com.launchly.bot.constant.BotConstants;
import com.launchly.bot.dto.response.BotResponse;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.mapper.BotResponseFactory;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.service.BotLifecycleService;
import com.launchly.bot.telegram.TelegramBotManager;
import com.launchly.bot.validator.BotAccessValidator;
import com.launchly.common.exception.AppException;
import com.launchly.common.utils.EncryptionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BotLifecycleServiceImpl implements BotLifecycleService {

    private final BotRepository botRepository;
    private final TelegramBotManager telegramBotManager;
    private final BotAccessValidator botAccessValidator;
    private final EncryptionUtil encryptionUtil;
    private final BotResponseFactory botResponseFactory;

    @Override
    @CacheEvict(value = "bots", key = "#userId")
    public BotResponse startBot(Long id, Long userId) {
        Bot bot = botAccessValidator.getBotWithAccess(id, userId);
        botAccessValidator.validateWriteAccess(bot, userId);

        if (bot.isActive()) {
            throw new AppException(HttpStatus.CONFLICT, "bot.error.already_running");
        }

        String decryptedToken = encryptionUtil.decrypt(bot.getTelegramToken());
        if (BotConstants.DUMMY_TOKEN_PLACEHOLDER.equals(decryptedToken)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "bot.error.token_required_to_start");
        }

        List<Bot> activeBotsList = botRepository.findAllByActiveTrue();
        for (Bot activeBot : activeBotsList) {
            if (!activeBot.getId().equals(bot.getId())) {
                String activeToken = encryptionUtil.decrypt(activeBot.getTelegramToken());
                if (decryptedToken.equals(activeToken)) {
                    telegramBotManager.unregisterBot(activeBot.getId());
                    activeBot.setActive(false);
                    botRepository.save(activeBot);
                    log.info("Automatically deactivated bot id={} ('{}') because its token was assigned to bot id={} ('{}')",
                            activeBot.getId(), activeBot.getName(), bot.getId(), bot.getName());
                }
            }
        }

        telegramBotManager.registerBot(bot);

        try {
            bot.setActive(true);
            bot.setRunsCount(bot.getRunsCount() + 1);
            bot = botRepository.save(bot);
        } catch (Exception e) {
            try {
                telegramBotManager.unregisterBot(bot.getId());
            } catch (Exception ex) {
                log.warn("Failed to unregister bot on start rollback: {}", ex.getMessage());
            }
            throw e;
        }

        return botResponseFactory.toBotResponseWithStats(bot);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "bots", key = "#userId"),
            @CacheEvict(value = "flow_schemas", key = "#id")
    })
    public BotResponse publishBot(Long id, Long userId) {
        Bot bot = botAccessValidator.getBotWithAccess(id, userId);
        botAccessValidator.validateWriteAccess(bot, userId);

        bot.setRunsCount(bot.getRunsCount() + 1);
        bot.setUpdatedAt(LocalDateTime.now());

        if (!bot.isActive()) {
            boolean hasRealToken = false;
            try {
                if (bot.getTelegramToken() != null && !bot.getTelegramToken().isBlank()) {
                    String decrypted = encryptionUtil.decrypt(bot.getTelegramToken());
                    if (decrypted != null && !decrypted.isBlank() && 
                        !BotConstants.DUMMY_TOKEN_PLACEHOLDER.equals(decrypted)) {
                        hasRealToken = true;
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to decrypt bot token during publish: {}", e.getMessage());
            }

            if (hasRealToken) {
                try {
                    telegramBotManager.registerBot(bot);
                    bot.setActive(true);
                } catch (Exception e) {
                    log.error("Failed to register bot on publish: {}", e.getMessage(), e);
                }
            }
        }

        bot = botRepository.save(bot);
        return botResponseFactory.toBotResponseWithStats(bot);
    }

    @Override
    @CacheEvict(value = "bots", key = "#userId")
    public BotResponse stopBot(Long id, Long userId) {
        Bot bot = botAccessValidator.getBotWithAccess(id, userId);
        botAccessValidator.validateWriteAccess(bot, userId);

        if (!bot.isActive()) {
            throw new AppException(HttpStatus.CONFLICT, "bot.error.not_running");
        }

        telegramBotManager.unregisterBot(bot.getId());

        try {
            bot.setActive(false);
            bot = botRepository.save(bot);
        } catch (Exception e) {
            try {
                telegramBotManager.registerBot(bot);
            } catch (Exception ex) {
                log.error("Failed to re-register bot {} after stop failure: {}", bot.getId(), ex.getMessage(), ex);
            }
            throw e;
        }

        return botResponseFactory.toBotResponseWithStats(bot);
    }

    @Override
    public void releaseTokenFromOtherBots(String token, Long userId, Long currentBotId) {
        if (token == null || BotConstants.DUMMY_TOKEN_PLACEHOLDER.equals(token)) {
            return;
        }

        List<Bot> userBots = botRepository.findAllByUserId(userId);
        for (Bot otherBot : userBots) {
            if (!otherBot.getId().equals(currentBotId)) {
                try {
                    String decrypted = encryptionUtil.decrypt(otherBot.getTelegramToken());
                    if (token.equals(decrypted)) {
                        if (otherBot.isActive()) {
                            telegramBotManager.unregisterBot(otherBot.getId());
                            otherBot.setActive(false);
                        }
                        otherBot.setTelegramToken(encryptionUtil.encrypt(BotConstants.DUMMY_TOKEN_PLACEHOLDER));
                        otherBot.setUsername(null);
                        botRepository.save(otherBot);
                        log.info("Reassigned token to bot id={}. Automatically reset bot id={} ('{}') to Without bot (inactive)",
                                currentBotId, otherBot.getId(), otherBot.getName());
                    }
                } catch (Exception e) {
                    log.error("Failed to release token from other bot id={}: {}", otherBot.getId(), e.getMessage());
                }
            }
        }
    }

    @Override
    public void registerBot(Bot bot) {
        telegramBotManager.registerBot(bot);
    }

    @Override
    public void unregisterBot(Long botId) {
        telegramBotManager.unregisterBot(botId);
    }
}
