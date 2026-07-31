import apiClient from './axios';
import type {
  OrderResponse,
  OrderStatus,
  LeadResponse,
  LeadStatus,
  ConversationResponse,
  ConversationStatus,
  MessageResponse,
} from '../types/crm';

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

export const getConversationApi = async (conversationId: number): Promise<ConversationResponse> => {
  const response = await apiClient.get<ConversationResponse>(`/crm/conversations/${conversationId}`);
  return response.data;
};

export const getAllConversationsApi = async (): Promise<ConversationResponse[]> => {
  const response = await apiClient.get<ConversationResponse[]>(`/crm/conversations`);
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
  mediaType?: string,
  scheduledAt?: string
): Promise<MessageResponse> => {
  const response = await apiClient.post<MessageResponse>(
    `/crm/conversations/${conversationId}/messages`,
    { content, mediaUrl, mediaType, scheduledAt }
  );
  return response.data;
};

export const updateConversationApi = async (
  conversationId: number,
  data: { status?: ConversationStatus; unread?: boolean; favorite?: boolean; tags?: string[]; notes?: string }
): Promise<ConversationResponse> => {
  const response = await apiClient.patch<ConversationResponse>(`/crm/conversations/${conversationId}`, data);
  return response.data;
};

export const sendNoteApi = async (
  conversationId: number,
  content: string
): Promise<MessageResponse> => {
  const response = await apiClient.post<MessageResponse>(
    `/crm/conversations/${conversationId}/notes`,
    { content }
  );
  return response.data;
};

export const getLabelsApi = async (): Promise<string[]> => {
  const response = await apiClient.get<string[]>('/crm/labels');
  return response.data;
};

export const addLabelApi = async (name: string): Promise<string[]> => {
  const response = await apiClient.post<string[]>('/crm/labels', { name });
  return response.data;
};

export const deleteLabelApi = async (name: string): Promise<string[]> => {
  const response = await apiClient.delete<string[]>(`/crm/labels/${encodeURIComponent(name)}`);
  return response.data;
};
