import apiClient from './axios';

export interface SupportMessageItem {
  id: number;
  ticketId: number;
  sender: 'USER' | 'MANAGER' | 'SYSTEM';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface SupportTicketItem {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userAvatar?: string | null;
  subject?: string | null;
  unread: boolean;
  unreadForUser?: boolean;
  isFavorite: boolean;
  status: 'ACTIVE' | 'RESOLVED' | 'CLOSED';
  lastMessage?: string | null;
  lastMessageTime?: string | null;
  messages?: SupportMessageItem[];
  registeredAt?: string;
  lastActivityAt?: string;
  assignedManagerId?: number | null;
  assignedManagerName?: string | null;
  assignedManagerEmail?: string | null;
}

export interface PaginatedTickets {
  content: SupportTicketItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CreateTicketPayload {
  subject: string;
  message: string;
}

export const getUserTicketsApi = async (params?: { page?: number; size?: number }): Promise<PaginatedTickets> => {
  const response = await apiClient.get<PaginatedTickets>('/support/tickets', { params });
  return response.data;
};

export const getUserTicketDetailApi = async (id: number | string): Promise<SupportTicketItem> => {
  const response = await apiClient.get<SupportTicketItem>(`/support/tickets/${id}`);
  return response.data;
};

export const createTicketApi = async (data: CreateTicketPayload): Promise<SupportTicketItem> => {
  const response = await apiClient.post<SupportTicketItem>('/support/tickets', data);
  return response.data;
};

export const sendTicketMessageApi = async (ticketId: number | string, text: string): Promise<SupportMessageItem> => {
  const response = await apiClient.post<SupportMessageItem>(`/support/tickets/${ticketId}/messages`, { text });
  return response.data;
};

export const updateTicketStatusApi = async (ticketId: number | string, status = 'RESOLVED'): Promise<SupportTicketItem> => {
  const response = await apiClient.patch<SupportTicketItem>(`/support/tickets/${ticketId}/status`, null, {
    params: { status },
  });
  return response.data;
};
