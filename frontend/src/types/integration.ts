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
  | 'HUBSPOT';

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

export interface IntegrationResponse {
  id: number;
  name: string;
  type: IntegrationType;
  active: boolean;
  config: GoogleSheetsConfig | WebhookConfig | ExcelConfig | ApiKeyConfig | Record<string, never> | null;
  botId: number;
  createdAt: string;
}

export interface IntegrationCreateRequest {
  name: string;
  type: IntegrationType;
  botId: number;
  config: GoogleSheetsConfig | WebhookConfig | ExcelConfig | ApiKeyConfig | Record<string, never>;
}
