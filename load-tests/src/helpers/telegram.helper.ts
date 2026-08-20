import { TelegramUpdate } from '../types/telegram.types';

export class TelegramHelper {
  static createMessageUpdate(
    userId: number,
    text: string,
    chatId: number = userId,
    firstName: string = 'User'
  ): TelegramUpdate {
    return {
      update_id: Math.floor(Math.random() * 1000000) + 1,
      message: {
        message_id: Math.floor(Math.random() * 500000) + 1,
        from: {
          id: userId,
          is_bot: false,
          first_name: `${firstName}_${userId}`,
          username: `tg_user_${userId}`,
          language_code: 'en',
        },
        chat: {
          id: chatId,
          type: 'private',
          first_name: `${firstName}_${userId}`,
          username: `tg_user_${userId}`,
        },
        date: Math.floor(Date.now() / 1000),
        text,
      },
    };
  }

  static createCallbackQueryUpdate(
    userId: number,
    callbackData: string,
    chatId: number = userId
  ): TelegramUpdate {
    const msgId = Math.floor(Math.random() * 500000) + 1;
    return {
      update_id: Math.floor(Math.random() * 1000000) + 1,
      callback_query: {
        id: `cb_query_${Date.now()}_${userId}`,
        from: {
          id: userId,
          is_bot: false,
          first_name: `User_${userId}`,
          username: `tg_user_${userId}`,
        },
        message: {
          message_id: msgId,
          from: { id: 999999, is_bot: true, first_name: 'LaunchlyBot' },
          chat: { id: chatId, type: 'private' },
          date: Math.floor(Date.now() / 1000),
          text: 'Please select an option below:',
        },
        data: callbackData,
      },
    };
  }
}
