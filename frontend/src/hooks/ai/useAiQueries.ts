import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  chatApi,
  createAiSessionApi,
  deleteAiSessionApi,
  generateSchemaApi,
  getAiSessionDetailsApi,
  getAiSessionsApi,
  getAiUsageApi,
  updateAiSessionTitleApi,
} from '../../api/ai';
import type {
  AiChatRequest,
  AiSchemaRequest,
  CreateAiSessionRequest,
  UpdateAiSessionRequest,
} from '../../types';

export const useAiSessionsQuery = () => {
  return useQuery({
    queryKey: ['ai-sessions'],
    queryFn: getAiSessionsApi,
    refetchOnWindowFocus: false,
  });
};

export const useAiSessionDetailsQuery = (sessionId: number | null) => {
  return useQuery({
    queryKey: ['ai-session-details', sessionId],
    queryFn: () => getAiSessionDetailsApi(sessionId!),
    enabled: Boolean(sessionId && sessionId > 0),
    refetchOnWindowFocus: false,
  });
};

export const useCreateAiSessionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data?: CreateAiSessionRequest) => createAiSessionApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-sessions'] });
    },
  });
};

export const useUpdateAiSessionTitleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAiSessionRequest }) =>
      updateAiSessionTitleApi(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['ai-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['ai-session-details', updated.id] });
    },
  });
};

export const useDeleteAiSessionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAiSessionApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-sessions'] });
    },
  });
};

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
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['ai-usage'] });
      queryClient.invalidateQueries({ queryKey: ['ai-sessions'] });
      if (res.sessionId) {
        queryClient.invalidateQueries({ queryKey: ['ai-session-details', res.sessionId] });
      }
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
