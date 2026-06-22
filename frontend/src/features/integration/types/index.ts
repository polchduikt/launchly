export type IntegrationType = 'GOOGLE_SHEETS' | 'EXCEL' | 'WEBHOOK';

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

export interface IntegrationResponse {
  id: number;
  name: string;
  type: IntegrationType;
  active: boolean;
  config: GoogleSheetsConfig | WebhookConfig | ExcelConfig | null;
  botId: number;
  createdAt: string;
}

export interface IntegrationCreateRequest {
  name: string;
  type: IntegrationType;
  botId: number;
  config: GoogleSheetsConfig | WebhookConfig | ExcelConfig;
}
