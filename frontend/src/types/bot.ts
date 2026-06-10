export interface FlowSchemaResponse {
  id: number;
  schemaJson: string;
  updatedAt: string;
}

export interface BotResponse {
  id: number;
  name: string;
  description: string | null;
  avatar: string | null;
  avatarPublicId: string | null;
  active: boolean;
  createdAt: string;
}

export interface BotDetailResponse {
  id: number;
  name: string;
  description: string | null;
  avatar: string | null;
  avatarPublicId: string | null;
  active: boolean;
  telegramToken: string;
  flowSchema: FlowSchemaResponse | null;
  createdAt: string;
}

export interface BotCreateRequest {
  name: string;
  description?: string;
  telegramToken: string;
}

export interface BotUpdateRequest {
  name: string;
  description?: string;
  telegramToken?: string;
}
