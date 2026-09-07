import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomFieldsApi, saveCustomFieldsApi } from '../../api/bot';
import type { CustomFieldsResponse } from '../../types/customFields';

export type { CustomFieldsResponse };

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
