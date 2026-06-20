import apiClient from '../../../lib/axios';
import type { BotResponse, BotCreateRequest, BotDetailResponse, FlowSchemaResponse, BotUpdateRequest, BotUserResponse, BotUserUpdateRequest } from '../../../types/bot';


export const getBotsApi = async (): Promise<BotResponse[]> => {
  const response = await apiClient.get<BotResponse[]>('/bots');
  return response.data;
};

export const createBotApi = async (data: BotCreateRequest): Promise<BotResponse> => {
  const response = await apiClient.post<BotResponse>('/bots', data);
  return response.data;
};

export const updateBotApi = async (id: number, data: BotUpdateRequest): Promise<BotResponse> => {
  const response = await apiClient.put<BotResponse>(`/bots/${id}`, data);
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

export const getFlowSchemaApi = async (botId: number): Promise<FlowSchemaResponse> => {
  const response = await apiClient.get<FlowSchemaResponse>(`/bots/${botId}/schema`);
  return response.data;
};

export const saveFlowSchemaApi = async (
  botId: number,
  nodes: Record<string, unknown>[],
  edges: Record<string, unknown>[]
): Promise<FlowSchemaResponse> => {
  const response = await apiClient.put<FlowSchemaResponse>(`/bots/${botId}/schema`, {
    nodes,
    edges,
  });
  return response.data;
};

export const getBotUsersApi = async (botId: number): Promise<BotUserResponse[]> => {
  const response = await apiClient.get<BotUserResponse[]>(`/bots/${botId}/users`);
  return response.data;
};

export const updateBotUserApi = async (
  botId: number,
  userId: number,
  data: BotUserUpdateRequest
): Promise<BotUserResponse> => {
  const response = await apiClient.put<BotUserResponse>(`/bots/${botId}/users/${userId}`, data);
  return response.data;
};

export const deleteBotUserApi = async (botId: number, userId: number): Promise<void> => {
  await apiClient.delete(`/bots/${botId}/users/${userId}`);
};

