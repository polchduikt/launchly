import apiClient from './axios';
import type {
  AiChatRequest,
  AiChatResponse,
  AiChatSessionDetailResponse,
  AiChatSessionResponse,
  AiSchemaRequest,
  AiSchemaResponse,
  AiUsageResponse,
  CreateAiSessionRequest,
  UpdateAiSessionRequest,
} from '../types';

export const getAiSessionsApi = async (): Promise<AiChatSessionResponse[]> => {
  const response = await apiClient.get<AiChatSessionResponse[]>('/ai/sessions');
  return response.data;
};

export const getAiSessionDetailsApi = async (id: number): Promise<AiChatSessionDetailResponse> => {
  const response = await apiClient.get<AiChatSessionDetailResponse>(`/ai/sessions/${id}`);
  return response.data;
};

export const createAiSessionApi = async (data?: CreateAiSessionRequest): Promise<AiChatSessionResponse> => {
  const response = await apiClient.post<AiChatSessionResponse>('/ai/sessions', data || {});
  return response.data;
};

export const updateAiSessionTitleApi = async (id: number, data: UpdateAiSessionRequest): Promise<AiChatSessionResponse> => {
  const response = await apiClient.patch<AiChatSessionResponse>(`/ai/sessions/${id}`, data);
  return response.data;
};

export const deleteAiSessionApi = async (id: number): Promise<void> => {
  await apiClient.delete(`/ai/sessions/${id}`);
};

export const chatApi = async (data: AiChatRequest): Promise<AiChatResponse> => {
  const response = await apiClient.post<AiChatResponse>('/ai/chat', data);
  return response.data;
};

export const generateSchemaApi = async (data: AiSchemaRequest): Promise<AiSchemaResponse> => {
  const response = await apiClient.post<AiSchemaResponse>('/ai/generate-schema', data);
  return response.data;
};

export const getAiUsageApi = async (): Promise<AiUsageResponse> => {
  const response = await apiClient.get<AiUsageResponse>('/ai/usage');
  return response.data;
};
