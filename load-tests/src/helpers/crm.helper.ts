import { CrmLeadRequest } from '../types/crm.types';

export class CrmHelper {
  static createLeadPayload(index: number): CrmLeadRequest {
    const chatId = 100000000 + index;
    return {
      fullName: `Test Lead ${index}`,
      telegramUsername: `lead_user_${index}`,
      telegramChatId: chatId,
      phone: `+38050${String(index).padStart(7, '0')}`,
      email: `lead_${index}@launchly-loadtest.com`,
      tags: ['load_tested', `batch_${Math.floor(index / 100)}`, 'high_value'],
      status: 'NEW',
      source: 'k6_load_generator',
      metadata: {
        registeredAt: new Date().toISOString(),
        score: Math.floor(Math.random() * 100),
      },
    };
  }
}
