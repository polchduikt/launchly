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
    mutationFn: (data: unknown) => {
      const existing = queryClient.getQueryData<CustomFieldsResponse>(['custom-fields', botId]);
      let payload = data;
      if (existing && typeof existing === 'object' && typeof data === 'object' && data !== null) {
        const rawFields = (data as Record<string, unknown>).fields ?? existing.fields ?? [];
        const fieldsList = Array.isArray(rawFields) ? rawFields : [];
        const cleanFields = fieldsList.filter((f: unknown) => {
          const name = typeof f === 'string' ? f : (f as { name?: string })?.name;
          return name && !name.toLowerCase().includes('cooldown');
        });

        payload = {
          fields: cleanFields,
          archivedFields: (data as Record<string, unknown>).archivedFields ?? existing.archivedFields ?? [],
          folders: (data as Record<string, unknown>).folders ?? existing.folders ?? [],
        };
      }
      return saveCustomFieldsApi(botId as number, payload);
    },
    onSuccess: (savedData) => {
      if (botId) {
        queryClient.setQueryData(['custom-fields', botId], savedData);
        queryClient.invalidateQueries({ queryKey: ['custom-fields', botId] });
      }
    },
  });
};
