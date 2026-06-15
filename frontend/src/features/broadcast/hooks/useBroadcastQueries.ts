import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCampaignsApi,
  createCampaignApi,
  updateCampaignApi,
  sendCampaignApi,
  getTagsApi,
  createTagApi,
  deleteTagApi,
} from '../api/broadcast';
import type { CreateCampaignRequest, CreateTagRequest } from '../types';

export const useCampaignsQuery = (botId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['campaigns', botId],
    queryFn: () => getCampaignsApi(botId),
    enabled: enabled && botId > 0,
  });
};

export const useTagsQuery = (botId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['tags', botId],
    queryFn: () => getTagsApi(botId),
    enabled: enabled && botId > 0,
  });
};

export const useCreateCampaignMutation = (botId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateCampaignRequest) => createCampaignApi(botId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', botId] });
    },
  });
};

export const useUpdateCampaignMutation = (botId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, req }: { campaignId: number; req: CreateCampaignRequest }) =>
      updateCampaignApi(botId, campaignId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', botId] });
    },
  });
};

export const useSendCampaignMutation = (botId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId: number) => sendCampaignApi(botId, campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', botId] });
    },
  });
};

export const useCreateTagMutation = (botId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateTagRequest) => createTagApi(botId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', botId] });
    },
  });
};

export const useDeleteTagMutation = (botId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tagId: number) => deleteTagApi(botId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', botId] });
    },
  });
};
