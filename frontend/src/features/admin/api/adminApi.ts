import apiClient from '../../../lib/axios';

export interface AdminStats {
  totalUsers: number;
  activeBots: number;
  totalAutomations: number;
  totalMessagesSent: number;
  systemUptimeSeconds: number;
  activeManagers: number;
  userGrowth: { date: string; count: number }[];
  botActivity: { date: string; messagesCount: number }[];
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  avatar: string | null;
  role: 'ROLE_OWNER' | 'ROLE_ADMIN' | 'ROLE_MANAGER';
  active: boolean;
  provider: string;
  createdAt: string;
  botsCount: number;
  telegramUsername: string | null;
}

export interface AdminAutomation {
  id: number;
  name: string;
  triggerType: string;
  ownerEmail: string;
  ownerName: string;
  botName: string;
  active: boolean;
  triggerCount: number;
  errorCount: number;
  lastExecutedAt: string;
}

export interface AdminBroadcast {
  id: number;
  title: string;
  content: string;
  targetAudience: string;
  sentCount: number;
  status: string;
  createdByEmail: string;
  createdAt: string;
}

export interface AdminLog {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  service: string;
  message: string;
  userEmail: string;
  timestamp: string;
}

export const fetchAdminStatsApi = async (): Promise<AdminStats> => {
  const response = await apiClient.get<AdminStats>('/admin/stats');
  return response.data;
};

export const fetchAdminUsersApi = async (
  search = '',
  role = '',
  page = 0,
  size = 20
): Promise<{ content: AdminUser[]; totalElements: number; totalPages: number }> => {
  const params: Record<string, string | number> = { page, size };
  if (search) params.search = search;
  if (role) params.role = role;

  const response = await apiClient.get<{ content: AdminUser[]; totalElements: number; totalPages: number }>('/admin/users', { params });
  return response.data;
};

export const updateUserRoleApi = async (userId: number, role: string): Promise<AdminUser> => {
  const response = await apiClient.patch<AdminUser>(`/admin/users/${userId}/role`, { role });
  return response.data;
};

export const toggleUserStatusApi = async (userId: number): Promise<AdminUser> => {
  const response = await apiClient.patch<AdminUser>(`/admin/users/${userId}/status`);
  return response.data;
};

export const fetchAdminAutomationsApi = async (): Promise<AdminAutomation[]> => {
  const response = await apiClient.get<AdminAutomation[]>('/admin/automations');
  return response.data;
};

export const toggleAutomationApi = async (automationId: number): Promise<void> => {
  await apiClient.post(`/admin/automations/${automationId}/toggle`);
};

export const fetchAdminBroadcastsApi = async (): Promise<AdminBroadcast[]> => {
  const response = await apiClient.get<AdminBroadcast[]>('/admin/broadcasts');
  return response.data;
};

export const createAdminBroadcastApi = async (data: {
  title: string;
  content: string;
  targetAudience: string;
}): Promise<AdminBroadcast> => {
  const response = await apiClient.post<AdminBroadcast>('/admin/broadcasts', data);
  return response.data;
};

export const fetchAdminLogsApi = async (
  level = '',
  service = '',
  search = ''
): Promise<AdminLog[]> => {
  const params: Record<string, string> = {};
  if (level) params.level = level;
  if (service) params.service = service;
  if (search) params.search = search;

  const response = await apiClient.get<AdminLog[]>('/admin/logs', { params });
  return response.data;
};
