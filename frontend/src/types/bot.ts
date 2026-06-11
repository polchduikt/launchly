export interface FlowSchemaResponse {
  id: number;
  version: number;
  nodes: Record<string, unknown>[];
  edges: Record<string, unknown>[];
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

export interface BotDetailResponse extends BotResponse {
  telegramToken: string;
  flowSchema: FlowSchemaResponse | null;
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
