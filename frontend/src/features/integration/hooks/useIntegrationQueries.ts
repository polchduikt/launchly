import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getIntegrationsApi,
  createIntegrationApi,
  updateIntegrationApi,
  deleteIntegrationApi,
  toggleIntegrationApi,
} from '../api/integration';
import type { IntegrationCreateRequest } from '../types';

export const useIntegrationsQuery = () => {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: getIntegrationsApi,
  });
};

export const useCreateIntegrationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createIntegrationApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
};

export const useUpdateIntegrationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: IntegrationCreateRequest }) =>
      updateIntegrationApi(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
};

export const useDeleteIntegrationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteIntegrationApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
};

export const useToggleIntegrationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleIntegrationApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
};
