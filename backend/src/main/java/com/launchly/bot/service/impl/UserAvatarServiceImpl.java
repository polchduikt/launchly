package com.launchly.bot.service.impl;

import com.cloudinary.Cloudinary;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.service.UserAvatarService;
import com.launchly.bot.telegram.TelegramBotManager;
import com.launchly.common.utils.EncryptionUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.telegram.telegrambots.meta.api.methods.GetFile;
import org.telegram.telegrambots.meta.api.methods.GetUserProfilePhotos;
import org.telegram.telegrambots.meta.api.objects.File;
import org.telegram.telegrambots.meta.api.objects.PhotoSize;
import org.telegram.telegrambots.meta.api.objects.UserProfilePhotos;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class UserAvatarServiceImpl implements UserAvatarService {

    private final BotRepository botRepository;
    private final BotUserRepository botUserRepository;
    private final EncryptionUtil encryptionUtil;
    private final Cloudinary cloudinary;
    private final TelegramBotManager botManager;
    private final HttpClient httpClient;

    public UserAvatarServiceImpl(BotRepository botRepository,
                                  BotUserRepository botUserRepository,
                                  EncryptionUtil encryptionUtil,
                                  Cloudinary cloudinary,
                                  @Lazy TelegramBotManager botManager,
                                  HttpClient httpClient) {
        this.botRepository = botRepository;
        this.botUserRepository = botUserRepository;
        this.encryptionUtil = encryptionUtil;
        this.cloudinary = cloudinary;
        this.botManager = botManager;
        this.httpClient = httpClient;
    }

    @Override
    public void fetchAndSetPhotoUrl(BotUser botUser) {
        if (botUser == null || botUser.getBot() == null) {
            return;
        }
        Long botId = botUser.getBot().getId();
        TelegramClient telegramClient = botManager.getTelegramClient(botId);
        if (telegramClient == null) {
            return;
        }
        Bot bot = botRepository.findById(botId).orElse(null);
        if (bot == null) {
            return;
        }
        fetchAndSetPhotoUrl(botUser, bot, telegramClient);
    }

    @Override
    public void fetchAndSetPhotoUrl(BotUser botUser, Bot bot, TelegramClient telegramClient) {
        if (botUser == null || bot == null || telegramClient == null) {
            return;
        }
        try {
            GetUserProfilePhotos getUserProfilePhotos = GetUserProfilePhotos.builder()
                    .userId(botUser.getTelegramId())
                    .limit(1)
                    .build();
            UserProfilePhotos photos = telegramClient.execute(getUserProfilePhotos);
            if (photos != null && photos.getTotalCount() > 0 && photos.getPhotos() != null && !photos.getPhotos().isEmpty()) {
                List<PhotoSize> photoSizes = photos.getPhotos().getFirst();
                PhotoSize largest = photoSizes.stream()
                        .max(Comparator.comparingInt(size -> size.getWidth() * size.getHeight()))
                        .orElse(null);
                if (largest != null) {
                    GetFile getFile = GetFile.builder()
                            .fileId(largest.getFileId())
                            .build();
                    File file = telegramClient.execute(getFile);
                    if (file != null && file.getFilePath() != null) {
                        String botToken = encryptionUtil.decrypt(bot.getTelegramToken());
                        String fileUrl = "https://api.telegram.org/file/bot" + botToken + "/" + file.getFilePath();
                        try {
                            HttpRequest request = HttpRequest.newBuilder()
                                    .uri(URI.create(fileUrl))
                                    .GET()
                                    .build();
                            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
                            byte[] fileBytes = response.statusCode() == 200 ? response.body() : null;

                            if (fileBytes != null && fileBytes.length > 0) {
                                Map<String, Object> params = Map.of(
                                        "folder", "launchly/" + bot.getUser().getId() + "/contacts",
                                        "transformation", "c_limit,w_400,h_400,q_auto,f_auto"
                                );
                                Map<?, ?> result = cloudinary.uploader().upload(fileBytes, params);
                                String secureUrl = (String) result.get("secure_url");
                                botUser.setPhotoUrl(secureUrl);
                            } else {
                                botUser.setPhotoUrl(fileUrl);
                            }
                        } catch (Exception uploadEx) {
                            log.warn("Failed to upload profile photo to Cloudinary: {}", uploadEx.getMessage());
                            botUser.setPhotoUrl(fileUrl);
                        }
                        botUserRepository.save(botUser);
                        log.debug("Fetched profile photo for user {}", botUser.getTelegramId());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch profile photo for user {}: {}", botUser.getTelegramId(), e.getMessage());
        }
    }
}
