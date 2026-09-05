package com.launchly.bot.service.impl;

import com.launchly.auth.service.AuthService;
import com.launchly.bot.service.SystemBotAuthService;
import com.launchly.common.utils.MessageUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.telegram.telegrambots.meta.api.methods.GetFile;
import org.telegram.telegrambots.meta.api.methods.GetUserProfilePhotos;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.File;
import org.telegram.telegrambots.meta.api.objects.PhotoSize;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.UserProfilePhotos;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemBotAuthServiceImpl implements SystemBotAuthService {

    @Value("${telegram.system-bot-token:}")
    private String systemBotToken;

    private final AuthService authService;
    private final MessageUtils messageUtils;

    @Override
    public void handleSystemBotUpdate(Update update, TelegramClient client) {
        if (!update.hasMessage() || !update.getMessage().hasText()) {
            return;
        }

        String text = update.getMessage().getText().trim();
        Long chatId = update.getMessage().getChatId();

        if (text.startsWith("/start")) {
            String token = null;
            if (text.contains(" ")) {
                token = text.substring(text.indexOf(" ") + 1).trim();
            }

            if (token == null || token.isBlank()) {
                String welcomeMsg = messageUtils.getMessageWithDefault(
                        "bot.system.welcome",
                        "Welcome to Launchly! Please use the website to log in or link your account.");
                sendSystemBotMessage(chatId, welcomeMsg, client);
                return;
            }

            try {
                String telegramUsername = update.getMessage().getFrom().getUserName();
                Long telegramUserId = update.getMessage().getFrom().getId();

                String telegramName = update.getMessage().getFrom().getFirstName();
                if (update.getMessage().getFrom().getLastName() != null) {
                    telegramName += " " + update.getMessage().getFrom().getLastName();
                }

                String telegramPhotoUrl = null;
                try {
                    GetUserProfilePhotos getUserProfilePhotos = GetUserProfilePhotos.builder()
                            .userId(telegramUserId)
                            .limit(1)
                            .build();
                    UserProfilePhotos photos = client.execute(getUserProfilePhotos);
                    if (photos != null && photos.getTotalCount() > 0 && photos.getPhotos() != null && !photos.getPhotos().isEmpty()) {
                        List<PhotoSize> photoSizes = photos.getPhotos().get(0);
                        PhotoSize largest = photoSizes.stream()
                                .max(Comparator.comparingInt(size -> size.getWidth() * size.getHeight()))
                                .orElse(null);
                        if (largest != null) {
                            GetFile getFile = GetFile.builder()
                                    .fileId(largest.getFileId())
                                    .build();
                            File file = client.execute(getFile);
                            if (file != null && file.getFilePath() != null) {
                                telegramPhotoUrl = "https://api.telegram.org/file/bot" + systemBotToken + "/" + file.getFilePath();
                            }
                        }
                    }
                } catch (Exception ex) {
                    log.warn("Failed to fetch profile photo for telegram auth: {}", ex.getMessage());
                }

                boolean isSubscription = authService.handleTelegramAuth(token, telegramUserId, telegramUsername, telegramName, telegramPhotoUrl);

                if (isSubscription) {
                    String optinMsg = messageUtils.getMessageWithDefault(
                            "bot.system.optin_success",
                            "You are successfully opted-in. Now you are able to receive 'Launchly Official' bot notifications.\nIf you want to stop notifications in Telegram you have to opt-out.\nVisit 'My Telegram for Notifications' section in Settings -> Notifications.");
                    sendSystemBotMessage(chatId, optinMsg, client);
                } else {
                    String authSuccessMsg = messageUtils.getMessageWithDefault(
                            "bot.system.auth_success",
                            "Hi! You successfully signed up/logged in with Telegram. Thank you! You can now return to the website.");
                    sendSystemBotMessage(chatId, authSuccessMsg, client);
                }
            } catch (Exception e) {
                log.error("Failed to process system bot auth: {}", e.getMessage());
                String authFailedMsg = messageUtils.getMessageWithDefault(
                        "bot.system.auth_failed",
                        "Failed to authorize: " + e.getMessage(),
                        e.getMessage());
                sendSystemBotMessage(chatId, authFailedMsg, client);
            }
        } else {
            String useWebsiteMsg = messageUtils.getMessageWithDefault(
                    "bot.system.use_website",
                    "Please use the website to log in or link your account.");
            sendSystemBotMessage(chatId, useWebsiteMsg, client);
        }
    }

    private void sendSystemBotMessage(Long chatId, String text, TelegramClient client) {
        try {
            SendMessage message = SendMessage.builder()
                    .chatId(chatId.toString())
                    .text(text)
                    .build();
            client.execute(message);
        } catch (Exception e) {
            log.error("Failed to send message from system bot: {}", e.getMessage());
        }
    }
}
