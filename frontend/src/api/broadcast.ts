import apiClient from './axios';
import type {
  CampaignResponse,
  CreateCampaignRequest,
  TagResponse,
  CreateTagRequest,
} from '../types';

export const getCampaignsApi = async (botId: number): Promise<CampaignResponse[]> => {
  const response = await apiClient.get<CampaignResponse[]>(`/broadcast/bots/${botId}/campaigns`);
  return response.data;
};

export const createCampaignApi = async (
  botId: number,
  req: CreateCampaignRequest
): Promise<CampaignResponse> => {
  const response = await apiClient.post<CampaignResponse>(`/broadcast/bots/${botId}/campaigns`, req);
  return response.data;
};

export const updateCampaignApi = async (
  botId: number,
  campaignId: number,
  req: CreateCampaignRequest
): Promise<CampaignResponse> => {
  const response = await apiClient.put<CampaignResponse>(
    `/broadcast/bots/${botId}/campaigns/${campaignId}`,
    req
  );
  return response.data;
};

export const sendCampaignApi = async (
  botId: number,
  campaignId: number
): Promise<CampaignResponse> => {
  const response = await apiClient.post<CampaignResponse>(
    `/broadcast/bots/${botId}/campaigns/${campaignId}/send`
  );
  return response.data;
};

export const getTagsApi = async (botId: number): Promise<TagResponse[]> => {
  const response = await apiClient.get<TagResponse[]>(`/broadcast/bots/${botId}/tags`);
  return response.data;
};

export const createTagApi = async (
  botId: number,
  req: CreateTagRequest
): Promise<TagResponse> => {
  const response = await apiClient.post<TagResponse>(`/broadcast/bots/${botId}/tags`, req);
  return response.data;
};

export const updateTagApi = async (
  botId: number,
  tagId: number,
  req: CreateTagRequest
): Promise<TagResponse> => {
  const response = await apiClient.put<TagResponse>(`/broadcast/bots/${botId}/tags/${tagId}`, req);
  return response.data;
};

export const deleteTagApi = async (botId: number, tagId: number): Promise<void> => {
  await apiClient.delete(`/broadcast/bots/${botId}/tags/${tagId}`);
};

export const deleteCampaignApi = async (botId: number, campaignId: number): Promise<void> => {
  await apiClient.delete(`/broadcast/bots/${botId}/campaigns/${campaignId}`);
};

export const cancelScheduleApi = async (
  botId: number,
  campaignId: number
): Promise<CampaignResponse> => {
  const response = await apiClient.delete<CampaignResponse>(
    `/broadcast/bots/${botId}/campaigns/${campaignId}/schedule`
  );
  return response.data;
};
