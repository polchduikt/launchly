package com.launchly.bot.service.impl;

import com.launchly.billing.service.PlanLimitService;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.service.BotUserProvisioningService;
import com.launchly.bot.service.UserAvatarService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

@Slf4j
@Service
@RequiredArgsConstructor
public class BotUserProvisioningServiceImpl implements BotUserProvisioningService {

    private final BotUserRepository botUserRepository;
    private final PlanLimitService planLimitService;
    private final UserAvatarService userAvatarService;

    @Override
    public BotUser getOrCreateBotUser(Bot bot, Update update, Long telegramUserId, TelegramClient telegramClient) {
        BotUser botUser = botUserRepository.findByTelegramIdAndBotId(telegramUserId, bot.getId())
                .orElseGet(() -> {
                    planLimitService.checkBotUserLimit(bot.getId());
                    String username = null;
                    String firstName = null;
                    String lastName = null;

                    if (update.hasMessage() && update.getMessage().getFrom() != null) {
                        var from = update.getMessage().getFrom();
                        username = from.getUserName();
                        firstName = from.getFirstName();
                        lastName = from.getLastName();
                    } else if (update.hasCallbackQuery() && update.getCallbackQuery().getFrom() != null) {
                        var from = update.getCallbackQuery().getFrom();
                        username = from.getUserName();
                        firstName = from.getFirstName();
                        lastName = from.getLastName();
                    }

                    BotUser newUser = BotUser.builder()
                            .telegramId(telegramUserId)
                            .username(username)
                            .firstName(firstName)
                            .lastName(lastName)
                            .bot(bot)
                            .build();
                    return botUserRepository.save(newUser);
                });

        if ((botUser.getPhotoUrl() == null || botUser.getPhotoUrl().startsWith("https://api.telegram.org/")) && telegramClient != null) {
            userAvatarService.fetchAndSetPhotoUrl(botUser, bot, telegramClient);
        }

        return botUser;
    }
}
