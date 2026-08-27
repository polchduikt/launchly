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
import type {
  OrderStatus,
  LeadStatus,
  ConversationStatus,
  MessageResponse,
  OrderResponse,
  LeadResponse,
  ConversationResponse,
} from '../../types/crm';

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
    onMutate: async ({ orderId, status, notes }) => {
      await queryClient.cancelQueries({ queryKey: ['orders', botId] });
      const previousOrders = queryClient.getQueryData<OrderResponse[]>(['orders', botId]);
      if (previousOrders) {
        queryClient.setQueryData<OrderResponse[]>(['orders', botId], (old = []) =>
          old.map((order) => (order.id === orderId ? { ...order, status, notes } : order))
        );
      }
      return { previousOrders };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(['orders', botId], context.previousOrders);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', botId] });
    },
  });
};

export const useUpdateLeadMutation = (botId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, status, notes }: { leadId: number; status: LeadStatus; notes: string }) =>
      updateLeadApi(leadId, status, notes),
    onMutate: async ({ leadId, status, notes }) => {
      await queryClient.cancelQueries({ queryKey: ['leads', botId] });
      const previousLeads = queryClient.getQueryData<LeadResponse[]>(['leads', botId]);
      if (previousLeads) {
        queryClient.setQueryData<LeadResponse[]>(['leads', botId], (old = []) =>
          old.map((lead) => (lead.id === leadId ? { ...lead, status, notes } : lead))
        );
      }
      return { previousLeads };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousLeads) {
        queryClient.setQueryData(['leads', botId], context.previousLeads);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', botId] });
    },
  });
};

export const useSendMessageMutation = (conversationId: number, botId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ content, mediaUrl, mediaType, scheduledAt }: { content: string; mediaUrl?: string; mediaType?: string; scheduledAt?: string }) =>
      sendOwnerMessageApi(conversationId, content, mediaUrl, mediaType, scheduledAt),
    onMutate: async ({ content, mediaUrl, mediaType, scheduledAt }) => {
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });
      await queryClient.cancelQueries({ queryKey: ['conversations', botId] });
      await queryClient.cancelQueries({ queryKey: ['conversations', 'all'] });

      const previousMessages = queryClient.getQueryData<MessageResponse[]>(['messages', conversationId]);
      const previousBotConversations = queryClient.getQueryData<ConversationResponse[]>(['conversations', botId]);
      const previousAllConversations = queryClient.getQueryData<ConversationResponse[]>(['conversations', 'all']);

      const optimisticMessage: MessageResponse = {
        id: -Date.now(),
        conversationId,
        content,
        senderType: 'OWNER',
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        createdAt: new Date().toISOString(),
        scheduledAt,
        sent: true,
      };

      queryClient.setQueryData<MessageResponse[]>(['messages', conversationId], (old = []) => [...old, optimisticMessage]);

      const updateConversationsPreview = (list?: ConversationResponse[]) =>
        list?.map((conv) =>
          conv.id === conversationId
            ? { ...conv, lastMessage: content, lastMessageAt: new Date().toISOString() }
            : conv
        );

      if (previousBotConversations) {
        queryClient.setQueryData(['conversations', botId], updateConversationsPreview(previousBotConversations));
      }
      if (previousAllConversations) {
        queryClient.setQueryData(['conversations', 'all'], updateConversationsPreview(previousAllConversations));
      }

      return { previousMessages, previousBotConversations, previousAllConversations };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', conversationId], context.previousMessages);
      }
      if (context?.previousBotConversations) {
        queryClient.setQueryData(['conversations', botId], context.previousBotConversations);
      }
      if (context?.previousAllConversations) {
        queryClient.setQueryData(['conversations', 'all'], context.previousAllConversations);
      }
    },
    onSettled: () => {
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
    onMutate: async (content: string) => {
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });
      const previousMessages = queryClient.getQueryData<MessageResponse[]>(['messages', conversationId]);

      const optimisticNote: MessageResponse = {
        id: -Date.now(),
        conversationId,
        content: `Note: ${content}`,
        senderType: 'OWNER',
        mediaUrl: null,
        mediaType: null,
        createdAt: new Date().toISOString(),
        sent: true,
      };

      queryClient.setQueryData<MessageResponse[]>(['messages', conversationId], (old = []) => [...old, optimisticNote]);
      return { previousMessages };
    },
    onError: (_err, _content, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', conversationId], context.previousMessages);
      }
    },
    onSettled: () => {
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
    onMutate: async ({ conversationId, status, unread }) => {
      await queryClient.cancelQueries({ queryKey: ['conversation', conversationId] });
      await queryClient.cancelQueries({ queryKey: ['conversations', botId] });
      await queryClient.cancelQueries({ queryKey: ['conversations', 'all'] });

      const previousConversation = queryClient.getQueryData<ConversationResponse>(['conversation', conversationId]);
      const previousBotConversations = queryClient.getQueryData<ConversationResponse[]>(['conversations', botId]);
      const previousAllConversations = queryClient.getQueryData<ConversationResponse[]>(['conversations', 'all']);

      if (previousConversation) {
        queryClient.setQueryData<ConversationResponse>(['conversation', conversationId], {
          ...previousConversation,
          status: status ?? previousConversation.status,
          unread: unread ?? previousConversation.unread,
        });
      }

      const updateList = (list?: ConversationResponse[]) =>
        list?.map((conv) =>
          conv.id === conversationId
            ? { ...conv, status: status ?? conv.status, unread: unread ?? conv.unread }
            : conv
        );

      if (previousBotConversations) {
        queryClient.setQueryData(['conversations', botId], updateList(previousBotConversations));
      }
      if (previousAllConversations) {
        queryClient.setQueryData(['conversations', 'all'], updateList(previousAllConversations));
      }

      return { previousConversation, previousBotConversations, previousAllConversations };
    },
    onError: (_err, { conversationId }, context) => {
      if (context?.previousConversation) {
        queryClient.setQueryData(['conversation', conversationId], context.previousConversation);
      }
      if (context?.previousBotConversations) {
        queryClient.setQueryData(['conversations', botId], context.previousBotConversations);
      }
      if (context?.previousAllConversations) {
        queryClient.setQueryData(['conversations', 'all'], context.previousAllConversations);
      }
    },
    onSettled: (updated, _err, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', updated?.id || conversationId] });
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
