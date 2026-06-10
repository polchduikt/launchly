import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBotStore } from '../../../store/useBotStore';
import {
  getBotsApi,
  createBotApi,
  deleteBotApi,
  startBotApi,
  stopBotApi,
} from '../api/bot';
import type { BotCreateRequest } from '../../../types/bot';

export const useBotsQuery = (enabled: boolean = true) => {
  const setBots = useBotStore((state) => state.setBots);
  return useQuery({
    queryKey: ['bots'],
    queryFn: async () => {
      const data = await getBotsApi();
      setBots(data);
      return data;
    },
    enabled,
  });
};

export const useCreateBotMutation = () => {
  const queryClient = useQueryClient();
  const setActiveBot = useBotStore((state) => state.setActiveBot);
  return useMutation({
    mutationFn: (data: BotCreateRequest) => createBotApi(data),
    onSuccess: (newBot) => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
      const currentBots = useBotStore.getState().bots;
      useBotStore.getState().setBots([...currentBots, newBot]);
      setActiveBot(newBot);
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
