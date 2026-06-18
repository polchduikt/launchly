import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBotStore } from '../../../store/useBotStore';
import {
  createBotApi,
  deleteBotApi,
  startBotApi,
  stopBotApi,
  updateBotApi,
} from '../api/bot';
import type { BotCreateRequest, BotUpdateRequest } from '../../../types/bot';

export const useCreateBotMutation = () => {
  const queryClient = useQueryClient();
  const setActiveBotId = useBotStore((state) => state.setActiveBotId);
  return useMutation({
    mutationFn: (data: BotCreateRequest) => createBotApi(data),
    onSuccess: (newBot) => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
      setActiveBotId(newBot.id);
    },
  });
};

export const useDeleteBotMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteBotApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
    },
  });
};

export const useStartBotMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => startBotApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
    },
  });
};

export const useStopBotMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => stopBotApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
    },
  });
};

export const useUpdateBotMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BotUpdateRequest }) => updateBotApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
    },
  });
};
