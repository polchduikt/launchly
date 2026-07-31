export const ConversationStatus = {
  Open: 'OPEN',
  Closed: 'CLOSED',
} as const;

export type ConversationStatus = (typeof ConversationStatus)[keyof typeof ConversationStatus];

export const OrderStatus = {
  New: 'NEW',
  InProgress: 'IN_PROGRESS',
  Completed: 'COMPLETED',
  Cancelled: 'CANCELLED',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const LeadStatus = {
  New: 'NEW',
  Contacted: 'CONTACTED',
  Qualified: 'QUALIFIED',
  Converted: 'CONVERTED',
  Lost: 'LOST',
} as const;

export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const SenderType = {
  BotUser: 'BOT_USER',
  Owner: 'OWNER',
  Note: 'NOTE',
} as const;

export type SenderType = (typeof SenderType)[keyof typeof SenderType];
