import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useBotsQuery } from '../bot/useBotsQuery';
import {
  getCampaignsApi,
  createCampaignApi,
  updateCampaignApi,
  sendCampaignApi,
  getTagsApi,
  createTagApi,
  deleteTagApi,
  deleteCampaignApi,
  cancelScheduleApi,
} from '../../api/broadcast';
import type { CreateCampaignRequest, CreateTagRequest, TagResponse } from '../../types';

export const useCampaignsQuery = (botId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['campaigns', botId],
    queryFn: () => getCampaignsApi(botId),
    enabled: enabled && botId > 0,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const hasActive = data.some(
        (c) => c.status === 'IN_PROGRESS' || c.status === 'SCHEDULED'
      );
      return hasActive ? 3000 : false;
    },
  });
};

export const useTagsQuery = (botId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['tags', botId],
    queryFn: () => getTagsApi(botId),
    enabled: enabled && botId > 0,
  });
};

export const useAllTagsQuery = () => {
  const { data: bots = [], isLoading: isBotsLoading } = useBotsQuery();
  const queries = useQueries({
    queries: bots.map((bot) => ({
      queryKey: ['tags', bot.id],
      queryFn: () => getTagsApi(bot.id),
      enabled: bots.length > 0,
    })),
  });

  const tags = useMemo(() => {
    const list = queries.flatMap((q) => q.data || []);
    const uniqueMap = new Map<string, TagResponse>();
    list.forEach((t) => {
      if (t && t.name) {
        const key = t.name.trim().toLowerCase();
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, t);
        }
      }
    });
    return Array.from(uniqueMap.values());
  }, [queries]);

  const isLoading = isBotsLoading || queries.some((q) => q.isLoading);

  return { data: tags, isLoading, refetch: () => queries.forEach((q) => q.refetch()) };
};

export const useCreateCampaignMutation = (botId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateCampaignRequest) => createCampaignApi(botId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
};

export const useUpdateCampaignMutation = (botId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, req }: { campaignId: number; req: CreateCampaignRequest }) =>
      updateCampaignApi(botId, campaignId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
};

export const useSendCampaignMutation = (botId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: number | { botId: number; campaignId: number }) => {
      if (typeof params === 'number') {
        return sendCampaignApi(botId || 0, params);
      }
      return sendCampaignApi(params.botId, params.campaignId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
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

export const useDeleteCampaignMutation = (botId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: number | { botId: number; campaignId: number }) => {
      if (typeof params === 'number') {
        return deleteCampaignApi(botId || 0, params);
      }
      return deleteCampaignApi(params.botId, params.campaignId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
};

export const useCancelScheduleMutation = (botId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: number | { botId: number; campaignId: number }) => {
      if (typeof params === 'number') {
        return cancelScheduleApi(botId || 0, params);
      }
      return cancelScheduleApi(params.botId, params.campaignId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
};
