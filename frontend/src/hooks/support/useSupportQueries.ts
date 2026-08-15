import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserTicketsApi,
  getUserTicketDetailApi,
  createTicketApi,
  sendTicketMessageApi,
  updateTicketStatusApi,
  type CreateTicketPayload,
} from '../../api/support';

export const useUserTicketsQuery = (params?: { page?: number; size?: number }) => {
  return useQuery({
    queryKey: ['user-support-tickets', params],
    queryFn: () => getUserTicketsApi(params),
    refetchInterval: 5000,
  });
};

export const useUserTicketDetailQuery = (id: number | string | null) => {
  return useQuery({
    queryKey: ['user-support-ticket', id],
    queryFn: () => (id ? getUserTicketDetailApi(id) : null),
    enabled: !!id,
    refetchInterval: 4000,
  });
};

export const useCreateTicketMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTicketPayload) => createTicketApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-support-tickets'] });
    },
  });
};

export const useSendTicketMessageMutation = (ticketId: number | string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => {
      if (!ticketId) throw new Error('No ticket selected');
      return sendTicketMessageApi(ticketId, text);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-support-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['user-support-tickets'] });
    },
  });
};

export const useUpdateTicketStatusMutation = (ticketId: number | string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => {
      if (!ticketId) throw new Error('No ticket selected');
      return updateTicketStatusApi(ticketId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-support-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['user-support-tickets'] });
    },
  });
};
