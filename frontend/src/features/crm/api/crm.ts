import apiClient from '../../../lib/axios';
import type {
  OrderResponse,
  OrderStatus,
  LeadResponse,
  LeadStatus,
  ConversationResponse,
  MessageResponse,
} from '../../../types/crm';

export const getOrdersApi = async (botId: number): Promise<OrderResponse[]> => {
  const response = await apiClient.get<OrderResponse[]>(`/crm/bots/${botId}/orders`);
  return response.data;
};

export const updateOrderApi = async (
  orderId: number,
  status: OrderStatus,
  notes: string
): Promise<OrderResponse> => {
  const response = await apiClient.patch<OrderResponse>(`/crm/orders/${orderId}`, {
    status,
    notes,
  });
  return response.data;
};

export const getLeadsApi = async (botId: number): Promise<LeadResponse[]> => {
  const response = await apiClient.get<LeadResponse[]>(`/crm/bots/${botId}/leads`);
  return response.data;
};

export const updateLeadApi = async (
  leadId: number,
  status: LeadStatus,
  notes: string
): Promise<LeadResponse> => {
  const response = await apiClient.patch<LeadResponse>(`/crm/leads/${leadId}`, {
    status,
    notes,
  });
  return response.data;
};

export const getConversationsApi = async (botId: number): Promise<ConversationResponse[]> => {
  const response = await apiClient.get<ConversationResponse[]>(`/crm/bots/${botId}/conversations`);
  return response.data;
};

export const getMessagesApi = async (conversationId: number): Promise<MessageResponse[]> => {
  const response = await apiClient.get<MessageResponse[]>(`/crm/conversations/${conversationId}/messages`);
  return response.data;
};

export const sendOwnerMessageApi = async (
  conversationId: number,
  content: string,
  mediaUrl?: string,
  mediaType?: string
): Promise<MessageResponse> => {
  const response = await apiClient.post<MessageResponse>(
    `/crm/conversations/${conversationId}/messages`,
    { content, mediaUrl, mediaType }
  );
  return response.data;
};
