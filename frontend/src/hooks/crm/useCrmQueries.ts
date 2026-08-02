import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useBotsQuery } from '../bot/useBotsQuery';
import {
  getOrdersApi,
  updateOrderApi,
  getLeadsApi,
  updateLeadApi,
  getConversationsApi,
  getConversationApi,
  getAllConversationsApi,
  getMessagesApi,
  sendOwnerMessageApi,
  sendNoteApi,
  updateConversationApi,
} from '../../api/crm';
import {
  getBotUsersApi,
  updateBotUserApi,
  createBotUserApi,
  deleteBotUserApi,
} from '../../api/bot';
import type { OrderStatus, LeadStatus, ConversationStatus } from '../../types/crm';
import type { BotUserUpdateRequest, BotUserCreateRequest, BotUserResponse } from '../../types/bot';

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

export const useConversationQuery = (conversationId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversationApi(conversationId),
    enabled: enabled && conversationId > 0,
  });
};

export const useAllConversationsQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['conversations', 'all'],
    queryFn: () => getAllConversationsApi(),
    enabled: enabled,
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
    mutationFn: ({ content, mediaUrl, mediaType, scheduledAt }: { content: string; mediaUrl?: string; mediaType?: string; scheduledAt?: string }) =>
      sendOwnerMessageApi(conversationId, content, mediaUrl, mediaType, scheduledAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', botId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', 'all'] });
    },
  });
};

export const useSendNoteMutation = (conversationId: number, botId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => sendNoteApi(conversationId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', botId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', 'all'] });
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

export const useAllBotUsersQuery = () => {
  const { data: bots = [], isLoading: isBotsLoading } = useBotsQuery();
  const queries = useQueries({
    queries: bots.map((bot) => ({
      queryKey: ['botUsers', bot.id],
      queryFn: () => getBotUsersApi(bot.id),
      enabled: bots.length > 0,
    })),
  });

  const contacts = useMemo(() => {
    const list = queries.flatMap((q) => q.data || []);
    const uniqueMap = new Map<string | number, BotUserResponse>();
    list.forEach((u) => {
      if (u) {
        const key = u.telegramId ? String(u.telegramId) : u.id;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, u);
        }
      }
    });
    return Array.from(uniqueMap.values());
  }, [queries]);

  const isLoading = isBotsLoading || queries.some((q) => q.isLoading);

  return { data: contacts, isLoading, refetch: () => queries.forEach((q) => q.refetch()) };
};

export const useUpdateBotUserMutation = (botId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: BotUserUpdateRequest }) =>
      updateBotUserApi(botId, userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['botUsers', botId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', botId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', 'all'] });
    },
  });
};

export const useUpdateContactMetadataMutation = (botId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, metadata }: { userId: number; metadata: string }) =>
      updateBotUserApi(botId, userId, { metadata }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['botUsers', botId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', botId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', 'all'] });
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
      queryClient.invalidateQueries({ queryKey: ['conversations', 'all'] });
    },
  });
};

export const useUpdateConversationMutation = (botId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, status, unread }: { conversationId: number; status?: ConversationStatus; unread?: boolean }) =>
      updateConversationApi(conversationId, { status, unread }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', updated.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations', botId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', 'all'] });
    },
  });
};

export const useCreateBotUserMutation = (botId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BotUserCreateRequest) => createBotUserApi(botId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['botUsers', botId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', botId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', 'all'] });
    },
  });
};
