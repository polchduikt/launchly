import apiClient from './axios';
import type {
  BotCreateRequest,
  BotResponse,
  BotUserCreateRequest,
  BotUserResponse,
} from '../types';

export const getBotsApi = async (): Promise<BotResponse[]> => {
  const response = await apiClient.get<BotResponse[]>('/bots');
  return response.data;
};

export const getBotByIdApi = async (id: number): Promise<BotResponse> => {
  const response = await apiClient.get<BotResponse>(`/bots/${id}`);
  return response.data;
};

export const createBotApi = async (data: BotCreateRequest): Promise<BotResponse> => {
  const response = await apiClient.post<BotResponse>('/bots', data);
  return response.data;
};

export const updateBotApi = async (id: number, data: BotCreateRequest): Promise<BotResponse> => {
  const response = await apiClient.put<BotResponse>(`/bots/${id}`, data);
  return response.data;
};

export const deleteBotApi = async (id: number): Promise<void> => {
  await apiClient.delete(`/bots/${id}`);
};

export const getBotSchemaApi = async (id: number): Promise<any> => {
  const response = await apiClient.get<any>(`/bots/${id}/schema`);
  return response.data;
};

export const saveBotSchemaApi = async (id: number, schemaOrNodes: any, edges?: any): Promise<any> => {
  const payload = edges !== undefined ? { nodes: schemaOrNodes, edges } : schemaOrNodes;
  const response = await apiClient.put<any>(`/bots/${id}/schema`, payload);
  return response.data;
};

export const startBotApi = async (id: number): Promise<BotResponse> => {
  const response = await apiClient.post<BotResponse>(`/bots/${id}/start`);
  return response.data;
};

export const stopBotApi = async (id: number): Promise<BotResponse> => {
  const response = await apiClient.post<BotResponse>(`/bots/${id}/stop`);
  return response.data;
};

export const getBotUsersApi = async (botId: number): Promise<BotUserResponse[]> => {
  const response = await apiClient.get<BotUserResponse[]>(`/bots/${botId}/users`);
  return response.data;
};

export const createBotUserApi = async (
  botId: number,
  data: BotUserCreateRequest
): Promise<BotUserResponse> => {
  const response = await apiClient.post<BotUserResponse>(`/bots/${botId}/users`, data);
  return response.data;
};

export const getFlowSchemaApi = getBotSchemaApi;
export const saveFlowSchemaApi = saveBotSchemaApi;

export const updateBotUserApi = async (
  botId: number,
  userId: number,
  data: any
): Promise<BotUserResponse> => {
  const response = await apiClient.put<BotUserResponse>(`/bots/${botId}/users/${userId}`, data);
  return response.data;
};

export const deleteBotUserApi = async (botId: number, userId: number): Promise<void> => {
  await apiClient.delete(`/bots/${botId}/users/${userId}`);
};

const parseJsonIfNeeded = (data: any): any => {
  let res = data;
  while (typeof res === 'string') {
    try {
      res = JSON.parse(res);
    } catch {
      break;
    }
  }
  return res;
};

export const getCustomFieldsApi = async (botId: number): Promise<any> => {
  const response = await apiClient.get<any>(`/bots/${botId}/custom-fields`);
  return parseJsonIfNeeded(response.data);
};

export const saveCustomFieldsApi = async (botId: number, data: any): Promise<any> => {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  const response = await apiClient.put<any>(`/bots/${botId}/custom-fields`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return parseJsonIfNeeded(response.data);
};

export const getAutomationFoldersApi = async (): Promise<any> => {
  const response = await apiClient.get<any>('/bots/automation-folders');
  return parseJsonIfNeeded(response.data);
};

export const saveAutomationFoldersApi = async (data: any): Promise<any> => {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  const response = await apiClient.put<any>('/bots/automation-folders', payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return parseJsonIfNeeded(response.data);
};
