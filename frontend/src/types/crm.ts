export type ConversationStatus = 'OPEN' | 'CLOSED';

export interface ConversationResponse {
  id: number;
  status: ConversationStatus;
  botUserName: string;
  botUserUsername: string | null;
  botUserTelegramId: number;
  lastMessage: string | null;
  lastMessageAt: string | null;
  updatedAt: string;
}

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';

export interface LeadResponse {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  status: LeadStatus;
  notes: string | null;
  data: string | null; // custom JSON payload
  botUserName: string;
  botUserUsername: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SenderType = 'BOT_USER' | 'OWNER';

export interface MessageResponse {
  id: number;
  conversationId: number;
  content: string;
  senderType: SenderType;
  createdAt: string;
}

export type OrderStatus = 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

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
