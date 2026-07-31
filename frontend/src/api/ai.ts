import apiClient from './axios';
import type {
  AiChatRequest,
  AiChatResponse,
  AiSchemaRequest,
  AiSchemaResponse,
  AiUsageResponse,
} from '../types';

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
