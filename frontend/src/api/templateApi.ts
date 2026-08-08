import apiClient from './axios';

export interface CreateTemplatePayload {
  botId: number;
  name: string;
  description?: string;
  avatarUrl?: string;
  isProtected?: boolean;
  guideUrl?: string;
  videoUrl?: string;
  selectedFlowIds?: string[];
  selectedBroadcastIds?: number[];
  selectedTagIds?: number[];
  selectedFieldIds?: number[];
}

export interface UpdateTemplatePayload {
  name?: string;
  description?: string;
  avatarUrl?: string;
  isProtected?: boolean;
  guideUrl?: string;
  videoUrl?: string;
  selectedFlowIds?: string[];
  selectedBroadcastIds?: number[];
  selectedTagIds?: number[];
  selectedFieldIds?: number[];
}

export interface TemplateResponse {
  id: number;
  shareCode: string;
  shareUrl: string;
  name: string;
  description: string;
  avatarUrl?: string;
  isProtected: boolean;
  guideUrl?: string;
  videoUrl?: string;
  creatorId?: number;
  creatorName: string;
  sourceBotId?: number;
  sourceBotName: string;
  sourceBotDescription?: string;
  schemaJson?: string;
  flowCount: number;
  broadcastCount: number;
  tagCount: number;
  fieldCount: number;
  selectedFlowIds?: string[];
  selectedBroadcastIds?: number[];
  selectedTagIds?: number[];
  selectedFieldIds?: number[];
  broadcastsDataJson?: string;
  tagsDataJson?: string;
  customFieldsDataJson?: string;
  createdAt: string;
  updatedAt?: string;
}

export const createTemplateApi = async (payload: CreateTemplatePayload): Promise<TemplateResponse> => {
  const response = await apiClient.post<TemplateResponse>('/templates/create', payload);
  return response.data;
};

export const getMyTemplatesApi = async (): Promise<TemplateResponse[]> => {
  const response = await apiClient.get<TemplateResponse[]>('/templates/my');
  return response.data;
};

export const getInstalledTemplatesApi = async (): Promise<TemplateResponse[]> => {
  const response = await apiClient.get<TemplateResponse[]>('/templates/installed');
  return response.data;
};

export const getTemplateByShareCodeApi = async (shareCode: string): Promise<TemplateResponse> => {
  const response = await apiClient.get<TemplateResponse>(`/templates/${shareCode}`);
  return response.data;
};

export const updateTemplateApi = async (shareCode: string, payload: UpdateTemplatePayload): Promise<TemplateResponse> => {
  const response = await apiClient.put<TemplateResponse>(`/templates/${shareCode}`, payload);
  return response.data;
};

export const installTemplateApi = async (shareCode: string, targetBotId?: number | null): Promise<void> => {
  if (targetBotId) {
    await apiClient.post(`/templates/install/${shareCode}?botId=${targetBotId}`);
  } else {
    await apiClient.post(`/templates/install/${shareCode}`);
  }
};

export const deleteTemplateApi = async (shareCode: string): Promise<void> => {
  await apiClient.delete(`/templates/${shareCode}`);
};

export const deleteInstalledTemplateApi = async (shareCode: string): Promise<void> => {
  await apiClient.delete(`/templates/installed/${shareCode}`);
};
