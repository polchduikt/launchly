import type { ConversationStatus, LeadStatus, SenderType, OrderStatus } from '../enums/crm.enums';
export type { ConversationStatus, LeadStatus, SenderType, OrderStatus };

export interface ConversationResponse {
  id: number;
  status: ConversationStatus;
  unread: boolean;
  favorite?: boolean;
  tags?: string[];
  notes?: string | null;
  botUserName: string;
  botUserUsername: string | null;
  botUserTelegramId: number;
  botUserPhotoUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  updatedAt: string;
  botId: number;
  botName: string;
}

export interface LeadResponse {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  status: LeadStatus;
  notes: string | null;
  data: string | null; 
  botUserName: string;
  botUserUsername: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageResponse {
  id: number;
  conversationId: number;
  content: string;
  senderType: SenderType;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
  scheduledAt?: string;
  sent?: boolean;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  notes: string | null;
  items: string | null;
  botUserName: string;
  botUserUsername: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BotUserMetadata {
  registeredAt?: string;
  source?: string;
  referrer?: string;
  totalOrders?: number;
  totalLeads?: number;
  tags?: string[];
  notes?: string;
  [key: string]: unknown;
}

export interface FilterCondition {
  id: string;
  field: 'tag' | 'opt_in' | 'order' | 'lead' | 'source' | 'paused' | 'optedInTelegram' | 'firstName' | 'lastName' | 'fullName' | 'email' | 'phone' | 'id' | 'telegramUserId' | 'telegramUsername' | 'createdAt' | string;
  operator: 'is' | 'is_not' | 'contains' | 'begins with' | "doesn't contain" | 'has any value' | 'is unknown' | 'after' | 'before' | string;
  value: string;
  label?: string;
}

export interface SequenceItem {
  id: number;
  name: string;
  stepsCount?: number;
  count?: number;
  status: 'ACTIVE' | 'PAUSED';
}
