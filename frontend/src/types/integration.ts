export type IntegrationType =
  | 'GOOGLE_SHEETS'
  | 'EXCEL'
  | 'WEBHOOK'
  | 'CHATGPT'
  | 'CLAUDE'
  | 'DEEPSEEK'
  | 'GEMINI'
  | 'HOTMART'
  | 'MAILCHIMP'
  | 'HUBSPOT'
  | 'STRIPE'
  | 'PAYPAL';

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
  dataType: 'ORDERS' | 'LEADS';
  email?: string;
  accountName?: string;
}

export interface WebhookConfig {
  url: string;
  events: ('ORDER_CREATED' | 'LEAD_CREATED')[];
  secret?: string;
}

export interface ExcelConfig {
  dataType: 'ORDERS' | 'LEADS';
}

export interface ApiKeyConfig {
  apiKey: string;
}

export interface MailchimpConfig {
  apiKey: string;
  listId: string;
  serverPrefix?: string;
  tags?: string[];
}

export interface HotmartConfig {
  hottok: string;
  syncOrders?: boolean;
  syncLeads?: boolean;
}

export interface StripeConfig {
  connected?: boolean;
  apiKey?: string;
  [key: string]: any;
}

export interface PaypalConfig {
  paypalClientId?: string;
  paypalWebhookId?: string;
  paypalLiveClientId?: string;
  paypalLiveWebhookId?: string;
  currency?: string;
  notifyMessenger?: boolean;
  notifyEmail?: boolean;
  sendReceiptEmail?: boolean;
  orders?: any[];
  [key: string]: any;
}

export interface IntegrationResponse {
  id: number;
  name: string;
  type: IntegrationType;
  active: boolean;
  config: Record<string, any> | null;
  botId: number;
  createdAt: string;
}

export interface IntegrationCreateRequest {
  name: string;
  type: IntegrationType;
  botId: number;
  config: Record<string, any>;
}
