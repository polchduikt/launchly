import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserTicketsApi,
  getUserTicketDetailApi,
  createTicketApi,
  sendTicketMessageApi,
  updateTicketStatusApi,
  type CreateTicketPayload,
  type SupportTicketItem,
  type SupportMessageItem,
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
    onMutate: async (text: string) => {
      if (!ticketId) return;
      await queryClient.cancelQueries({ queryKey: ['user-support-ticket', ticketId] });
      const previousTicket = queryClient.getQueryData<SupportTicketItem>(['user-support-ticket', ticketId]);

      if (previousTicket) {
        const optimisticMsg: SupportMessageItem = {
          id: -Date.now(),
          ticketId: Number(ticketId),
          sender: 'USER',
          senderName: 'Ви',
          text,
          timestamp: new Date().toISOString(),
        };

        queryClient.setQueryData<SupportTicketItem>(['user-support-ticket', ticketId], {
          ...previousTicket,
          messages: [...(previousTicket.messages || []), optimisticMsg],
          lastMessage: text,
          lastMessageTime: new Date().toISOString(),
        });
      }

      return { previousTicket };
    },
    onError: (_err, _text, context) => {
      if (ticketId && context?.previousTicket) {
        queryClient.setQueryData(['user-support-ticket', ticketId], context.previousTicket);
      }
    },
    onSettled: () => {
      if (ticketId) {
        queryClient.invalidateQueries({ queryKey: ['user-support-ticket', ticketId] });
      }
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
    onMutate: async (status: string) => {
      if (!ticketId) return;
      await queryClient.cancelQueries({ queryKey: ['user-support-ticket', ticketId] });
      const previousTicket = queryClient.getQueryData<SupportTicketItem>(['user-support-ticket', ticketId]);

      if (previousTicket) {
        queryClient.setQueryData<SupportTicketItem>(['user-support-ticket', ticketId], {
          ...previousTicket,
          status: status as SupportTicketItem['status'],
        });
      }

      return { previousTicket };
    },
    onError: (_err, _status, context) => {
      if (ticketId && context?.previousTicket) {
        queryClient.setQueryData(['user-support-ticket', ticketId], context.previousTicket);
      }
    },
    onSettled: () => {
      if (ticketId) {
        queryClient.invalidateQueries({ queryKey: ['user-support-ticket', ticketId] });
      }
      queryClient.invalidateQueries({ queryKey: ['user-support-tickets'] });
    },
  });
};
