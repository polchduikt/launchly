import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBotStore } from '../../store/useBotStore';
import { queryKeys } from '../../api/queryKeys';
import {
  createBotApi,
  deleteBotApi,
  startBotApi,
  publishBotApi,
  stopBotApi,
  updateBotApi,
} from '../../api/bot';
import type { BotCreateRequest, BotUpdateRequest, BotResponse } from '../../types/bot';

export const useCreateBotMutation = () => {
  const queryClient = useQueryClient();
  const setActiveBotId = useBotStore((state) => state.setActiveBotId);
  return useMutation({
    mutationFn: (data: BotCreateRequest) => createBotApi(data),
    onSuccess: (newBot) => {
      queryClient.setQueryData<BotResponse[]>(queryKeys.bots.all, (old) => {
        if (!old) return [newBot];
        if (old.some((b) => b.id === newBot.id)) return old;
        return [...old, newBot];
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.bots.all });
      setActiveBotId(newBot.id);
    },
  });
};

export const useDeleteBotMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteBotApi(id),
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.bots.all });
      const previousBots = queryClient.getQueryData<BotResponse[]>(queryKeys.bots.all);
      if (previousBots) {
        queryClient.setQueryData<BotResponse[]>(queryKeys.bots.all, (old = []) =>
          old.filter((b) => b.id !== id)
        );
      }
      return { previousBots };
    },
    onError: (_err, _id, context) => {
      if (context?.previousBots) {
        queryClient.setQueryData(queryKeys.bots.all, context.previousBots);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bots.all });
    },
  });
};

export const useStartBotMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => startBotApi(id),
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.bots.all });
      const previousBots = queryClient.getQueryData<BotResponse[]>(queryKeys.bots.all);
      if (previousBots) {
        queryClient.setQueryData<BotResponse[]>(queryKeys.bots.all, (old = []) =>
          old.map((b) => (b.id === id ? { ...b, active: true, runs: (b.runs ?? 0) + 1, updatedAt: new Date().toISOString() } : b))
        );
      }
      return { previousBots };
    },
    onError: (_err, _id, context) => {
      if (context?.previousBots) {
        queryClient.setQueryData(queryKeys.bots.all, context.previousBots);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bots.all });
    },
  });
};

export const usePublishBotMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => publishBotApi(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bots.all });
      queryClient.setQueryData(queryKeys.bots.detail(data.id), data);
    },
  });
};

export const useStopBotMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => stopBotApi(id),
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.bots.all });
      const previousBots = queryClient.getQueryData<BotResponse[]>(queryKeys.bots.all);
      if (previousBots) {
        queryClient.setQueryData<BotResponse[]>(queryKeys.bots.all, (old = []) =>
          old.map((b) => (b.id === id ? { ...b, active: false, updatedAt: new Date().toISOString() } : b))
        );
      }
      return { previousBots };
    },
    onError: (_err, _id, context) => {
      if (context?.previousBots) {
        queryClient.setQueryData(queryKeys.bots.all, context.previousBots);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bots.all });
    },
  });
};

export const useUpdateBotMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BotUpdateRequest }) => updateBotApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bots.all });
    },
  });
};
