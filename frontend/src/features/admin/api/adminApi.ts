import apiClient from '../../../lib/axios';

export interface PlanDistribution {
  name: string;
  value: number;
  color: string;
}

export interface AdminStats {
  totalUsers: number;
  totalOwners: number;
  totalOwnersChange: string;
  activeOwners: number;
  activeOwnersChange: string;
  totalBotUsers: number;
  totalBotUsersChange: string;
  activeBots: number;
  activeBotsChange: string;
  totalAutomations: number;
  totalAutomationsChange: string;
  totalMessagesSent: number;
  totalMessagesSentChange: string;
  systemUptimeSeconds: number;
  activeManagers: number;
  userGrowth: {
    date: string;
    registeredCount: number;
    activeCount: number;
    clientsCount: number;
    botsCount: number;
    automationsCount: number;
    messagesCount: number;
  }[];
  botActivity: { date: string; messagesCount: number }[];
  mrr: number;
  mrrChange: string;
  ltv: number;
  ltvChange: string;
  planDistribution: PlanDistribution[];
  integrationsPopularity: {
    name: string;
    count: number;
    percentage: number;
    change: string;
  }[];
  geographyAndLanguages: {
    name: string;
    count: number;
    percentage: number;
    change: string;
  }[];
  latestLogs: {
    id: string;
    level: string;
    service: string;
    message: string;
    userEmail: string;
    timestamp: string;
  }[];
  performanceMetrics: {
    time: string;
    errorRate: number;
    latency: number;
  }[];
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  avatar: string | null;
  role: 'ROLE_OWNER' | 'ROLE_ADMIN' | 'ROLE_MANAGER';
  active: boolean;
  blockReason?: string;
  blockedAt?: string;
  provider: string;
  createdAt: string;
  botsCount: number;
  automationsCount?: number;
  broadcastsCount?: number;
  contactsCount?: number;
  messagesCount?: number;
  planName?: string;
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

export const fetchAdminStatsApi = async (
  search = '',
  period = '',
  startDate = '',
  endDate = ''
): Promise<AdminStats> => {
  const params: Record<string, string> = {};
  if (search) params.search = search;
  if (period) params.period = period;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const response = await apiClient.get<AdminStats>('/admin/stats', { params });
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

export const toggleUserStatusApi = async (userId: number, blockData?: { reason: string; details?: string }): Promise<AdminUser> => {
  const response = await apiClient.patch<AdminUser>(`/admin/users/${userId}/status`, blockData);
  return response.data;
};

export interface fetchAdminAutomationDetailsApiParams {
  automationId: number;
  period?: string;
  page?: number;
  size?: number;
}

export interface AdminAutomationDetail {
  id: number;
  name: string;
  triggerType: string;
  botId: number | null;
  botName: string;
  botActive: boolean;
  ownerId: number | null;
  ownerName: string;
  ownerEmail: string;
  ownerAvatar: string | null;
  nodesCount: number;
  edgesCount: number;
  integrationsCount: number;
  version: number;
  triggerCount: number;
  errorCount: number;
  createdAt: string;
  updatedAt: string;
  activities: {
    content: UserActivity[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  };
}

export const fetchAdminAutomationsApi = async (
  search = '',
  status = '',
  page = 0,
  size = 30
): Promise<{ content: AdminAutomation[]; totalElements: number; totalPages: number }> => {
  const params: Record<string, string | number> = { page, size };
  if (search) params.search = search;
  if (status) params.status = status;

  const response = await apiClient.get<{ content: AdminAutomation[]; totalElements: number; totalPages: number }>('/admin/automations', { params });
  return response.data;
};

export const fetchAdminAutomationDetailsApi = async (
  automationId: number,
  period = 'all',
  page = 0,
  size = 20
): Promise<AdminAutomationDetail> => {
  const params: Record<string, string | number> = { period, page, size };
  const response = await apiClient.get<AdminAutomationDetail>(`/admin/automations/${automationId}/details`, { params });
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

export interface UserActivity {
  id: number;
  title: string;
  description: string;
  category: 'automations' | 'broadcasts' | 'system';
  badge: string;
  timestamp: string;
}

export interface AdminUserDetail {
  id: number;
  email: string;
  name: string;
  avatar: string | null;
  role: 'ROLE_OWNER' | 'ROLE_ADMIN' | 'ROLE_MANAGER';
  active: boolean;
  blockReason?: string;
  blockedAt?: string;
  provider: string;
  createdAt: string;
  telegramUsername: string | null;
  botsCount: number;
  automationsCount: number;
  broadcastsCount: number;
  contactsCount: number;
  messagesCount: number;
  planName: string;
  planStatus: string;
  lastActivity: string;
  activities: {
    content: UserActivity[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  };
}

export const fetchAdminUserDetailsApi = async (
  userId: number,
  period = 'all',
  category = 'all',
  page = 0,
  size = 20
): Promise<AdminUserDetail> => {
  const params: Record<string, string | number> = { period, category, page, size };
  const response = await apiClient.get<AdminUserDetail>(`/admin/users/${userId}/details`, { params });
  return response.data;
};
