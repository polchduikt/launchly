import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOrdersApi,
  updateOrderApi,
  getLeadsApi,
  updateLeadApi,
  getConversationsApi,
  getMessagesApi,
  sendOwnerMessageApi,
} from '../api/crm';
import {
  getBotUsersApi,
  updateBotUserApi,
  deleteBotUserApi,
} from '../../bot/api/bot';
import type { OrderStatus, LeadStatus } from '../../../types/crm';
import type { BotUserUpdateRequest } from '../../../types/bot';

export const useOrdersQuery = (botId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['orders', botId],
    queryFn: () => getOrdersApi(botId),
    enabled: enabled && botId > 0,
  });
};

export const useLeadsQuery = (botId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['leads', botId],
    queryFn: () => getLeadsApi(botId),
    enabled: enabled && botId > 0,
  });
};

export const useConversationsQuery = (botId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['conversations', botId],
    queryFn: () => getConversationsApi(botId),
    enabled: enabled && botId > 0,
  });
};

export const useMessagesQuery = (conversationId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getMessagesApi(conversationId),
    enabled: enabled && conversationId > 0,
  });
};

export const useUpdateOrderMutation = (botId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status, notes }: { orderId: number; status: OrderStatus; notes: string }) =>
      updateOrderApi(orderId, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', botId] });
    },
  });
};

export const useUpdateLeadMutation = (botId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, status, notes }: { leadId: number; status: LeadStatus; notes: string }) =>
      updateLeadApi(leadId, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', botId] });
    },
  });
};

export const useSendMessageMutation = (conversationId: number, botId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ content, mediaUrl, mediaType }: { content: string; mediaUrl?: string; mediaType?: string }) =>
      sendOwnerMessageApi(conversationId, content, mediaUrl, mediaType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', botId] });
    },
  });
};

export const useBotUsersQuery = (botId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['botUsers', botId],
    queryFn: () => getBotUsersApi(botId),
    enabled: enabled && botId > 0,
  });
};

export const useUpdateBotUserMutation = (botId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: BotUserUpdateRequest }) =>
      updateBotUserApi(botId, userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['botUsers', botId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', botId] });
    },
  });
};

export const useDeleteBotUserMutation = (botId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => deleteBotUserApi(botId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['botUsers', botId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', botId] });
    },
  });
};
