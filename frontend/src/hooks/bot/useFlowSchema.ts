import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFlowSchemaApi, saveFlowSchemaApi } from '../../api/bot';
import type { FlowSchemaResponse } from '../../types/bot';

export const useFlowSchemaQuery = (botId: number) => {
  return useQuery<FlowSchemaResponse, Error>({
    queryKey: ['flowSchema', botId],
    queryFn: () => getFlowSchemaApi(botId),
    enabled: !!botId,
  });
};

export const useSaveFlowSchemaMutation = (botId: number) => {
  const queryClient = useQueryClient();

  return useMutation<FlowSchemaResponse, Error, { nodes: Record<string, unknown>[]; edges: Record<string, unknown>[] }>({
    mutationFn: ({ nodes, edges }) => saveFlowSchemaApi(botId, nodes, edges),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flowSchema', botId] });
    },
  });
};
