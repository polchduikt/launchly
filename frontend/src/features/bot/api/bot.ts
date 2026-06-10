import apiClient from '../../../lib/axios';
import type { BotResponse, BotCreateRequest, BotDetailResponse } from '../../../types/bot';

export const getBotsApi = async (): Promise<BotResponse[]> => {
  const response = await apiClient.get<BotResponse[]>('/bots');
  return response.data;
};

export const createBotApi = async (data: BotCreateRequest): Promise<BotResponse> => {
  const response = await apiClient.post<BotResponse>('/bots', data);
  return response.data;
};

export const getBotDetailApi = async (id: number): Promise<BotDetailResponse> => {
  const response = await apiClient.get<BotDetailResponse>(`/bots/${id}`);
  return response.data;
};

export const deleteBotApi = async (id: number): Promise<void> => {
  await apiClient.delete(`/bots/${id}`);
};

export const startBotApi = async (id: number): Promise<BotResponse> => {
  const response = await apiClient.post<BotResponse>(`/bots/${id}/start`);
  return response.data;
};

export const stopBotApi = async (id: number): Promise<BotResponse> => {
  const response = await apiClient.post<BotResponse>(`/bots/${id}/stop`);
  return response.data;
};
