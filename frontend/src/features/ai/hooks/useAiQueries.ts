import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi, generateSchemaApi, getAiUsageApi } from '../api/ai';
import type { AiChatRequest, AiSchemaRequest } from '../types';

export const useAiUsageQuery = () => {
  return useQuery({
    queryKey: ['ai-usage'],
    queryFn: getAiUsageApi,
    refetchOnWindowFocus: false,
  });
};

export const useAiChatMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AiChatRequest) => chatApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-usage'] });
    },
  });
};

export const useAiSchemaMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AiSchemaRequest) => generateSchemaApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-usage'] });
    },
  });
};
