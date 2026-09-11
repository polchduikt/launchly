import apiClient from './axios';
import type { Node, Edge } from '@xyflow/react';
import type {
  BotCreateRequest,
  BotUpdateRequest,
  BotResponse,
  BotUserCreateRequest,
  BotUserResponse,
} from '../types';
import type { FlowSchemaResponse, BotUserUpdateRequest } from '../types/bot';

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

export const updateBotApi = async (id: number, data: BotUpdateRequest): Promise<BotResponse> => {
  const response = await apiClient.put<BotResponse>(`/bots/${id}`, data);
  return response.data;
};

export const deleteBotApi = async (id: number): Promise<void> => {
  await apiClient.delete(`/bots/${id}`);
};

export const getBotSchemaApi = async (id: number): Promise<FlowSchemaResponse> => {
  const response = await apiClient.get<FlowSchemaResponse>(`/bots/${id}/schema`);
  return response.data;
};

export const saveBotSchemaApi = async (
  id: number,
  schemaOrNodes: { nodes: Node[]; edges: Edge[] } | Node[] | Record<string, unknown>[],
  edges?: Edge[] | Record<string, unknown>[]
): Promise<FlowSchemaResponse> => {
  const payload = edges !== undefined ? { nodes: schemaOrNodes, edges } : schemaOrNodes;
  const response = await apiClient.put<FlowSchemaResponse>(`/bots/${id}/schema`, payload);
  return response.data;
};

export const startBotApi = async (id: number): Promise<BotResponse> => {
  const response = await apiClient.post<BotResponse>(`/bots/${id}/start`);
  return response.data;
};

export const publishBotApi = async (id: number): Promise<BotResponse> => {
  const response = await apiClient.post<BotResponse>(`/bots/${id}/publish`);
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
  data: Partial<BotUserUpdateRequest> | Record<string, unknown>
): Promise<BotUserResponse> => {
  const response = await apiClient.put<BotUserResponse>(`/bots/${botId}/users/${userId}`, data);
  return response.data;
};

export const deleteBotUserApi = async (botId: number, userId: number): Promise<void> => {
  await apiClient.delete(`/bots/${botId}/users/${userId}`);
};

import type { CustomFieldsResponse } from '../types/customFields';

export interface AutomationFolder {
  id: string | number;
  name: string;
}

export interface AutomationFoldersResponse {
  folders?: AutomationFolder[];
  [key: string]: unknown;
}

const parseJsonIfNeeded = <T>(data: unknown): T => {
  let res = data;
  while (typeof res === 'string') {
    try {
      res = JSON.parse(res);
    } catch {
      break;
    }
  }
  return res as T;
};

export const getCustomFieldsApi = async (botId: number): Promise<CustomFieldsResponse> => {
  const response = await apiClient.get<unknown>(`/bots/${botId}/custom-fields`);
  return parseJsonIfNeeded<CustomFieldsResponse>(response.data);
};

export const saveCustomFieldsApi = async (botId: number, data: CustomFieldsResponse | unknown): Promise<CustomFieldsResponse> => {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  const response = await apiClient.put<unknown>(`/bots/${botId}/custom-fields`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return parseJsonIfNeeded<CustomFieldsResponse>(response.data);
};

export const getAutomationFoldersApi = async (): Promise<AutomationFoldersResponse> => {
  const response = await apiClient.get<unknown>('/bots/automation-folders');
  return parseJsonIfNeeded<AutomationFoldersResponse>(response.data);
};

export const saveAutomationFoldersApi = async (data: AutomationFoldersResponse | unknown): Promise<AutomationFoldersResponse> => {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  const response = await apiClient.put<unknown>('/bots/automation-folders', payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return parseJsonIfNeeded<AutomationFoldersResponse>(response.data);
};
