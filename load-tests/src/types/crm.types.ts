export interface CrmLeadRequest {
  fullName: string;
  telegramUsername?: string;
  telegramChatId: number;
  phone?: string;
  email?: string;
  tags?: string[];
  status?: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface CrmLeadResponse {
  id: string;
  botId: string;
  fullName: string;
  telegramUsername?: string;
  telegramChatId: number;
  phone?: string;
  email?: string;
  tags: string[];
  status: string;
  createdAt: string;
}

export interface CrmMessageRequest {
  conversationId: string;
  text: string;
  senderType: 'USER' | 'BOT' | 'ADMIN';
}
