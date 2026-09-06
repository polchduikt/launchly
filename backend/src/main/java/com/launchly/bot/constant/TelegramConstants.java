package com.launchly.bot.constant;

public final class TelegramConstants {

    private TelegramConstants() {
    }

    public static final String API_BASE_URL = "https://api.telegram.org/";
    public static final String BOT_API_URL = API_BASE_URL + "bot";
    public static final String FILE_API_URL = API_BASE_URL + "file/bot";
    public static final String TELEGRAM_DEEP_LINK = "https://t.me/";
    public static final String TELEGRAM_USER_LINK = "tg://user?id=";
    public static final String GET_ME_URL_TEMPLATE = BOT_API_URL + "%s/getMe";
    public static final String DELETE_WEBHOOK_URL_TEMPLATE = BOT_API_URL + "%s/deleteWebhook?drop_pending_updates=false";
    public static final String FILE_DOWNLOAD_URL_TEMPLATE = FILE_API_URL + "%s/%s";
}
