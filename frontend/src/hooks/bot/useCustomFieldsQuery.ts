import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomFieldsApi, saveCustomFieldsApi } from '../../api/bot';

export interface CustomFieldsResponse {
  fields?: Array<{ name: string; type?: string; description?: string }>;
  archivedFields?: Array<{ name: string; type?: string; description?: string }>;
  folders?: Array<{ id: string | number; name: string }>;
  [key: string]: unknown;
}

export const useCustomFieldsQuery = (botId: number | null | undefined, enabled: boolean = true) => {
  return useQuery<CustomFieldsResponse>({
    queryKey: ['custom-fields', botId],
    queryFn: () => getCustomFieldsApi(botId as number),
    enabled: enabled && Boolean(botId && botId > 0),
    staleTime: 30_000,
  });
};

export const useSaveCustomFieldsMutation = (botId: number | null | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => saveCustomFieldsApi(botId as number, data),
    onSuccess: (savedData) => {
      if (botId) {
        queryClient.setQueryData(['custom-fields', botId], savedData);
        queryClient.invalidateQueries({ queryKey: ['custom-fields', botId] });
      }
    },
  });
};
